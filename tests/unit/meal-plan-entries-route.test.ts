import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mealPlan: { findFirst: vi.fn() },
    mealPlanEntry: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { PATCH } from "@/app/api/meal-plans/[planId]/entries/route";
import { prisma } from "@/lib/prisma";

function mockTransactionWith(client: unknown) {
  const transactionMock = prisma.$transaction as unknown as {
    mockImplementation: (impl: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>) => void;
  };
  transactionMock.mockImplementation(async (callback) => callback(client));
}

describe("meal plan entries route mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "user-1" } } as never);
    vi.mocked(prisma.mealPlan.findFirst).mockResolvedValue({ id: "plan-1" } as never);
    vi.mocked(prisma.mealPlanEntry.findMany).mockResolvedValue([] as never);
  });

  it("swaps recipe when replacement is published and meal-type compatible", async () => {
    const tx = {
      mealPlanEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: "entry-1", mealType: "DINNER" }),
        update: vi.fn().mockResolvedValue({}),
      },
      recipe: {
        findFirst: vi.fn().mockResolvedValue({ id: "recipe-2" }),
      },
      $executeRaw: vi.fn(),
    };
    mockTransactionWith(tx);

    const response = await PATCH(
      new Request("http://localhost/api/meal-plans/plan-1/entries", {
        method: "PATCH",
        body: JSON.stringify({ action: "swap", entryId: "entry-1", recipeId: "recipe-2" }),
      }),
      { params: Promise.resolve({ planId: "plan-1" }) }
    );

    expect(response.status).toBe(200);
    expect(tx.recipe.findFirst).toHaveBeenCalledWith({
      where: { id: "recipe-2", status: "PUBLISHED", mealType: "DINNER" },
      select: { id: true },
    });
    expect(tx.mealPlanEntry.update).toHaveBeenCalledWith({ where: { id: "entry-1" }, data: { recipeId: "recipe-2" } });
  });

  it("rejects swap when replacement recipe is unpublished or wrong meal type", async () => {
    const tx = {
      mealPlanEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: "entry-1", mealType: "DINNER" }),
        update: vi.fn().mockResolvedValue({}),
      },
      recipe: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      $executeRaw: vi.fn(),
    };
    mockTransactionWith(tx);

    const response = await PATCH(
      new Request("http://localhost/api/meal-plans/plan-1/entries", {
        method: "PATCH",
        body: JSON.stringify({ action: "swap", entryId: "entry-1", recipeId: "recipe-2" }),
      }),
      { params: Promise.resolve({ planId: "plan-1" }) }
    );

    const body = (await response.json()) as { error: string };
    expect(response.status).toBe(404);
    expect(body.error).toBe("Recipe not found");
    expect(tx.mealPlanEntry.update).not.toHaveBeenCalled();
  });

  it("moves entry down when target day is empty", async () => {
    vi.mocked(prisma.mealPlanEntry.findMany).mockResolvedValue([
      {
        id: "entry-1",
        recipeId: "recipe-1",
        dayOfWeek: 2,
        mealType: "DINNER",
        orderIndex: 0,
        servings: 4,
        recipe: { title: "Chili" },
      },
    ] as never);

    const tx = {
      mealPlanEntry: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "entry-1", mealType: "DINNER", dayOfWeek: 1 })
          .mockResolvedValueOnce(null),
        update: vi.fn().mockResolvedValue({}),
      },
      recipe: { findFirst: vi.fn() },
      $executeRaw: vi.fn(),
    };
    mockTransactionWith(tx);

    const response = await PATCH(
      new Request("http://localhost/api/meal-plans/plan-1/entries", {
        method: "PATCH",
        body: JSON.stringify({ action: "move", entryId: "entry-1", direction: "down" }),
      }),
      { params: Promise.resolve({ planId: "plan-1" }) }
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { entries: Array<{ id: string }> };
    expect(body.entries[0]?.id).toBe("entry-1");
    expect(tx.mealPlanEntry.update).toHaveBeenCalledWith({ where: { id: "entry-1" }, data: { dayOfWeek: 2 } });
  });

  it("duplicates entry into the next open weekday", async () => {
    const tx = {
      mealPlanEntry: {
        findFirst: vi.fn().mockResolvedValue({ id: "entry-1", mealType: "DINNER", recipeId: "recipe-1", orderIndex: 0, servings: 4 }),
        findMany: vi.fn().mockResolvedValue([{ dayOfWeek: 1 }, { dayOfWeek: 2 }]),
        create: vi.fn().mockResolvedValue({}),
      },
      recipe: { findFirst: vi.fn() },
      $executeRaw: vi.fn(),
    };
    mockTransactionWith(tx);

    const response = await PATCH(
      new Request("http://localhost/api/meal-plans/plan-1/entries", {
        method: "PATCH",
        body: JSON.stringify({ action: "duplicate", entryId: "entry-1" }),
      }),
      { params: Promise.resolve({ planId: "plan-1" }) }
    );

    expect(response.status).toBe(200);
    expect(tx.mealPlanEntry.create).toHaveBeenCalledWith({
      data: {
        mealPlanId: "plan-1",
        recipeId: "recipe-1",
        dayOfWeek: 3,
        mealType: "DINNER",
        orderIndex: 0,
        servings: 4,
      },
    });
  });

  it("reorders days with a single atomic update", async () => {
    const tx = {
      mealPlanEntry: {
        findFirst: vi
          .fn()
          .mockResolvedValueOnce({ id: "entry-1", dayOfWeek: 1, mealType: "DINNER" })
          .mockResolvedValueOnce({ id: "entry-2", dayOfWeek: 2, mealType: "DINNER" }),
      },
      recipe: { findFirst: vi.fn() },
      $executeRaw: vi.fn(),
    };
    mockTransactionWith(tx);

    const response = await PATCH(
      new Request("http://localhost/api/meal-plans/plan-1/entries", {
        method: "PATCH",
        body: JSON.stringify({ action: "reorderDays", entryId: "entry-1", mealType: "DINNER", sourceDay: 1, targetDay: 2 }),
      }),
      { params: Promise.resolve({ planId: "plan-1" }) }
    );

    expect(response.status).toBe(200);
    expect(tx.mealPlanEntry.findFirst).toHaveBeenCalledWith({
      where: { id: "entry-1", mealPlanId: "plan-1", mealType: "DINNER", dayOfWeek: 1 },
    });
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
  });
});

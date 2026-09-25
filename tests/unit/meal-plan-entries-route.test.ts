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

describe("meal plan entries route swap mutation", () => {
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
});

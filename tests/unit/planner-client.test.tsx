/* @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlannerClient } from "@/app/planner/planner-client";

describe("PlannerClient export", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("downloads planner export json with expected filename and payload", async () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn((blob: Blob) => {
      void blob;
      return "blob:planner-export";
    });
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { writable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <PlannerClient
        weekdays={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        planId="plan-1"
        entries={[
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 1,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
        ]}
        suggestions={[{ id: "recipe-2", title: "Soup", cuisine: "Comfort", totalMinutes: 30 }]}
        groceries={[{ name: "onion", quantity: 2, unit: "pcs", category: "PRODUCE" }]}
        recipeOptions={[{ id: "recipe-1", title: "Chili", cuisine: "Comfort", totalMinutes: 35 }]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Export JSON" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0]?.[0];
    if (!blob) throw new Error("Expected export blob");
    expect(blob).toBeInstanceOf(Blob);
    const payload = JSON.parse(await blob.text()) as {
      entries: Array<{ id: string }>;
      suggestions: Array<{ title: string }>;
      groceries: Array<{ name: string }>;
    };
    expect(payload.entries[0]?.id).toBe("entry-1");
    expect(payload.suggestions[0]?.title).toBe("Soup");
    expect(payload.groceries[0]?.name).toBe("onion");
    expect(clickSpy).toHaveBeenCalledOnce();

    vi.runAllTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:planner-export");
  });

  it("sends reorder mutation payload on dinner drag and drop", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 2,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PlannerClient
        weekdays={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        planId="plan-1"
        entries={[
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 1,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
          {
            id: "entry-2",
            recipeId: "recipe-2",
            dayOfWeek: 2,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Soup" },
          },
        ]}
        suggestions={[]}
        groceries={[]}
        recipeOptions={[
          { id: "recipe-1", title: "Chili", cuisine: "Comfort", totalMinutes: 35 },
          { id: "recipe-2", title: "Soup", cuisine: "Comfort", totalMinutes: 30 },
        ]}
      />
    );

    fireEvent.dragStart(screen.getByTestId("planner-drag-1"));
    fireEvent.dragOver(screen.getByTestId("planner-day-2"));
    fireEvent.drop(screen.getByTestId("planner-day-2"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, { body: string }];
    expect(url).toBe("/api/meal-plans/plan-1/entries");
    expect(JSON.parse(options.body)).toEqual({
      action: "reorderDays",
      mealType: "DINNER",
      sourceDay: 1,
      targetDay: 2,
    });
  });

  it("shows status and skips fetch when no active plan is available", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PlannerClient
        weekdays={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        planId={null}
        entries={[
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 1,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
        ]}
        suggestions={[]}
        groceries={[]}
        recipeOptions={[{ id: "recipe-1", title: "Chili", cuisine: "Comfort", totalMinutes: 35 }]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move up" }));
    expect(screen.getByText("Create an active plan before editing.")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends move, duplicate, and swap payloads from planner controls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        entries: [
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 1,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <PlannerClient
        weekdays={["Mon", "Tue", "Wed", "Thu", "Fri"]}
        planId="plan-1"
        entries={[
          {
            id: "entry-1",
            recipeId: "recipe-1",
            dayOfWeek: 1,
            mealType: "DINNER",
            orderIndex: 0,
            servings: 4,
            recipe: { title: "Chili" },
          },
        ]}
        suggestions={[]}
        groceries={[]}
        recipeOptions={[
          { id: "recipe-1", title: "Chili", cuisine: "Comfort", totalMinutes: 35 },
          { id: "recipe-2", title: "Soup", cuisine: "Comfort", totalMinutes: 30 },
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Move down" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ action: "move", entryId: "entry-1", direction: "down" });

    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ action: "duplicate", entryId: "entry-1" });

    fireEvent.change(screen.getByLabelText("Swap dinner recipe"), { target: { value: "recipe-2" } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({ action: "swap", entryId: "entry-1", recipeId: "recipe-2" });
  });
});

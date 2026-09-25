/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
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
});

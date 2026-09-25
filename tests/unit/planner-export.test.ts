import { describe, expect, it } from "vitest";
import { buildPlannerExportPayload } from "@/app/planner/planner-export";

describe("buildPlannerExportPayload", () => {
  it("returns export payload with entries, suggestions, groceries, and timestamp", () => {
    const payload = buildPlannerExportPayload({
      exportedAt: "2026-09-25T00:00:00.000Z",
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
      suggestions: [{ id: "recipe-2", title: "Soup", cuisine: "Comfort", totalMinutes: 30 }],
      groceries: [{ name: "onion", quantity: 2, unit: "pcs", category: "PRODUCE" }],
    });

    expect(payload).toEqual({
      exportedAt: "2026-09-25T00:00:00.000Z",
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
      suggestions: [{ id: "recipe-2", title: "Soup", cuisine: "Comfort", totalMinutes: 30 }],
      groceries: [{ name: "onion", quantity: 2, unit: "pcs", category: "PRODUCE" }],
    });
  });
});

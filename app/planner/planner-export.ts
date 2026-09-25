export type PlannerExportEntry = {
  id: string;
  recipeId: string;
  dayOfWeek: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  orderIndex: number;
  servings: number;
  recipe: { title: string };
};

export type PlannerExportSuggestion = {
  id: string;
  title: string;
  cuisine: string;
  totalMinutes: number;
};

export type PlannerExportGroceryItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

export function buildPlannerExportPayload(args: {
  exportedAt?: string;
  entries: PlannerExportEntry[];
  suggestions: PlannerExportSuggestion[];
  groceries: PlannerExportGroceryItem[];
}) {
  return {
    exportedAt: args.exportedAt ?? new Date().toISOString(),
    entries: args.entries,
    suggestions: args.suggestions,
    groceries: args.groceries,
  };
}

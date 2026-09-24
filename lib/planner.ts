export type PlannerRecipe = {
  id: string;
  title: string;
  cuisine: string;
  totalMinutes: number;
  dietaryTags: string[];
  allergyTags: string[];
  ingredients: Array<{ name: string; quantity: number; unit: string; category: string }>;
};

export type UserPreferenceInput = {
  allergies: string[];
  dietaryPreferences: string[];
  favoriteCuisines: string[];
  preferredCookingTime: number;
  dislikedIngredients: string[];
  recentRecipeIds: string[];
};

export function filterRecipesForUser(recipes: PlannerRecipe[], pref: UserPreferenceInput) {
  return recipes.filter((recipe) => {
    if (recipe.allergyTags.some((allergen) => pref.allergies.includes(allergen))) return false;
    if (pref.dietaryPreferences.length && !pref.dietaryPreferences.every((tag) => recipe.dietaryTags.includes(tag))) return false;
    if (recipe.totalMinutes > pref.preferredCookingTime) return false;
    if (recipe.ingredients.some((ingredient) => pref.dislikedIngredients.includes(ingredient.name.toLowerCase()))) return false;
    return true;
  });
}

export function scoreRecipe(recipe: PlannerRecipe, pref: UserPreferenceInput): number {
  let score = 0;
  if (pref.favoriteCuisines.includes(recipe.cuisine)) score += 25;
  if (pref.recentRecipeIds.includes(recipe.id)) score -= 30;
  score += Math.max(0, pref.preferredCookingTime - recipe.totalMinutes);
  return score;
}

export function suggestWeeklyDinnerPlan(recipes: PlannerRecipe[], pref: UserPreferenceInput) {
  return filterRecipesForUser(recipes, pref)
    .map((recipe) => ({ recipe, score: scoreRecipe(recipe, pref) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.recipe);
}

export type ConsolidatedItem = {
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

export function consolidateIngredients(recipes: PlannerRecipe[], scalingFactor: number): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem>();
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = `${ingredient.name.toLowerCase()}-${ingredient.unit}`;
      const quantity = ingredient.quantity * scalingFactor;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += quantity;
      } else {
        map.set(key, {
          name: ingredient.name,
          quantity,
          unit: ingredient.unit,
          category: ingredient.category,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

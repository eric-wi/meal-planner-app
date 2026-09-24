import { describe, expect, it } from "vitest";
import { consolidateIngredients, filterRecipesForUser, suggestWeeklyDinnerPlan } from "@/lib/planner";

const recipes = [
  {
    id: "a",
    title: "Safe Bowl",
    cuisine: "Mediterranean",
    totalMinutes: 25,
    dietaryTags: ["nut-free", "vegetarian"],
    allergyTags: [],
    ingredients: [
      { name: "chickpeas", quantity: 1, unit: "cup", category: "PANTRY" },
      { name: "spinach", quantity: 2, unit: "cup", category: "PRODUCE" },
    ],
  },
  {
    id: "b",
    title: "Peanut Noodles",
    cuisine: "Asian",
    totalMinutes: 20,
    dietaryTags: ["dairy-free"],
    allergyTags: ["nuts"],
    ingredients: [{ name: "peanuts", quantity: 1, unit: "cup", category: "PANTRY" }],
  },
  {
    id: "c",
    title: "Quick Couscous",
    cuisine: "Mediterranean",
    totalMinutes: 15,
    dietaryTags: ["nut-free", "vegetarian"],
    allergyTags: [],
    ingredients: [{ name: "couscous", quantity: 1, unit: "cup", category: "PANTRY" }],
  },
];

describe("planner filtering", () => {
  it("excludes allergens", () => {
    const result = filterRecipesForUser(recipes, {
      allergies: ["nuts"],
      dietaryPreferences: [],
      favoriteCuisines: [],
      preferredCookingTime: 40,
      dislikedIngredients: [],
      recentRecipeIds: [],
    });
    expect(result.map((recipe) => recipe.id)).toEqual(["a", "c"]);
  });

  it("respects dietary and time filters", () => {
    const result = filterRecipesForUser(recipes, {
      allergies: [],
      dietaryPreferences: ["vegetarian"],
      favoriteCuisines: [],
      preferredCookingTime: 25,
      dislikedIngredients: [],
      recentRecipeIds: [],
    });
    expect(result.map((recipe) => recipe.id)).toEqual(["a", "c"]);
  });

  it("consolidates and scales grocery items", () => {
    const result = consolidateIngredients([recipes[0], recipes[0]], 1.5);
    expect(result.find((item) => item.name === "chickpeas")?.quantity).toBe(3);
    expect(result.find((item) => item.name === "spinach")?.quantity).toBe(6);
  });

  it("ranks suggestions and penalizes recent repeats", () => {
    const result = suggestWeeklyDinnerPlan(recipes, {
      allergies: [],
      dietaryPreferences: [],
      favoriteCuisines: ["Mediterranean"],
      preferredCookingTime: 30,
      dislikedIngredients: [],
      recentRecipeIds: ["c"],
    });

    expect(result[0].id).toBe("a");
    expect(result.some((recipe) => recipe.id === "c")).toBe(true);
  });
});

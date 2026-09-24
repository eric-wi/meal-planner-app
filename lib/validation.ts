import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(10).max(128),
});

export const preferenceSchema = z.object({
  householdSize: z.coerce.number().int().min(1).max(12),
  mealsPerDay: z.coerce.number().int().min(1).max(5),
  cookingSkill: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  preferredCookingTime: z.coerce.number().int().min(10).max(180),
  dietaryPreferences: z.array(z.string()).max(10),
  allergies: z.array(z.string()).max(20),
  dislikedIngredients: z.array(z.string()).max(20),
  favoriteCuisines: z.array(z.string()).max(10),
  groceryStores: z.array(z.string()).max(10),
  leftoversEnabled: z.boolean(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const recipeFilterSchema = z.object({
  query: z.string().optional(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]).optional(),
  cuisine: z.string().optional(),
  maxMinutes: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(24).default(12),
});

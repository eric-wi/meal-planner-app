import { getServerSession } from "next-auth";
import { MealType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { consolidateIngredients, suggestWeeklyDinnerPlan } from "@/lib/planner";
import { prisma } from "@/lib/prisma";
import { PlannerClient } from "./planner-client";

export const dynamic = "force-dynamic";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <p>Unauthorized.</p>;

  const [user, recipes, activePlan] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { preferences: true } }),
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      include: {
        dietaryTags: { include: { dietaryTag: true } },
        allergyTags: { include: { allergyTag: true } },
        ingredients: { include: { ingredient: true } },
      },
      take: 60,
    }),
    prisma.mealPlan.findFirst({
      where: { userId: session.user.id, status: "ACTIVE" },
      include: {
        entries: {
          select: {
            id: true,
            recipeId: true,
            dayOfWeek: true,
            mealType: true,
            orderIndex: true,
            servings: true,
            recipe: { select: { title: true } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const pref = user?.preferences;
  const mapped = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    cuisine: r.cuisine,
    totalMinutes: r.totalMinutes,
    dietaryTags: r.dietaryTags.map((t) => t.dietaryTag.label),
    allergyTags: r.allergyTags.map((t) => t.allergyTag.label),
    ingredients: r.ingredients.map((i) => ({ name: i.ingredient.name.toLowerCase(), quantity: i.quantity, unit: i.unit, category: i.ingredient.category })),
  }));

  const suggestions = pref
    ? suggestWeeklyDinnerPlan(mapped, {
        allergies: pref.allergies,
        dietaryPreferences: pref.dietaryPreferences,
        favoriteCuisines: pref.favoriteCuisines,
        preferredCookingTime: pref.preferredCookingTime,
        dislikedIngredients: pref.dislikedIngredients.map((item) => item.toLowerCase()),
        recentRecipeIds: activePlan?.entries.map((entry) => entry.recipeId) ?? [],
      })
    : [];

  const groceries = consolidateIngredients(suggestions, Math.max(1, (pref?.householdSize ?? 2) / 4));
  const recipeOptions = recipes.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    mealType: recipe.mealType,
    cuisine: recipe.cuisine,
    totalMinutes: recipe.totalMinutes,
  }));

  return (
    <PlannerClient
      weekdays={weekdays}
      planId={activePlan?.id ?? null}
      entries={activePlan?.entries ?? []}
      suggestions={suggestions}
      groceries={groceries}
      recipeOptions={recipeOptions.filter((recipe) => recipe.mealType === MealType.DINNER)}
    />
  );
}

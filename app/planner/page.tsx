import { getServerSession } from "next-auth";
import { MealType } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { consolidateIngredients, suggestWeeklyDinnerPlan } from "@/lib/planner";
import { prisma } from "@/lib/prisma";

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
    prisma.mealPlan.findFirst({ where: { userId: session.user.id, status: "ACTIVE" }, include: { entries: { include: { recipe: true }, orderBy: { orderIndex: "asc" } } }, orderBy: { updatedAt: "desc" } }),
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Weekly planner</h1>
      <p className="text-sm text-zinc-600">Weekends are empty by default. Reorder with move up/down controls for keyboard accessibility.</p>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Current grid</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {weekdays.map((day, index) => {
            const dinner = activePlan?.entries.find((entry) => entry.dayOfWeek === index + 1 && entry.mealType === MealType.DINNER);
            const lunch = activePlan?.entries.find((entry) => entry.dayOfWeek === index + 1 && entry.mealType === MealType.LUNCH);
            const breakfast = activePlan?.entries.find((entry) => entry.dayOfWeek === index + 1 && entry.mealType === MealType.BREAKFAST);
            return (
              <div key={day} className="rounded border p-3">
                <h3 className="font-semibold">{day}</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li><strong>Breakfast:</strong> {breakfast?.recipe.title ?? "-"}</li>
                  <li><strong>Lunch:</strong> {lunch?.recipe.title ?? "-"}</li>
                  <li><strong>Dinner:</strong> {dinner?.recipe.title ?? "-"}</li>
                </ul>
                <div className="mt-3 flex gap-2 text-xs"><button className="rounded border px-2 py-1">Move up</button><button className="rounded border px-2 py-1">Move down</button><button className="rounded border px-2 py-1">Duplicate</button></div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Personalized suggestions</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">{suggestions.map((r) => <li key={r.id} className="rounded border p-3 text-sm"><div className="font-medium">{r.title}</div><div>{r.cuisine} · {r.totalMinutes} min</div></li>)}</ul>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Dinners-only grocery preview</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">{groceries.map((item) => <li key={`${item.name}-${item.unit}`} className="rounded border p-2 text-sm">{item.quantity.toFixed(1)} {item.unit} {item.name} ({item.category})</li>)}</ul>
      </section>
    </div>
  );
}

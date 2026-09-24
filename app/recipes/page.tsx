import Link from "next/link";
import { RecipeStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Params = Promise<{ q?: string; mealType?: "BREAKFAST" | "LUNCH" | "DINNER"; page?: string }>;

export default async function RecipesPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const page = Number(params.page ?? "1");

  const recipes = await prisma.recipe.findMany({
    where: {
      status: RecipeStatus.PUBLISHED,
      ...(params.mealType ? { mealType: params.mealType } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: "insensitive" } },
              { summary: { contains: params.q, mode: "insensitive" } },
              { ingredients: { some: { ingredient: { name: { contains: params.q, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    },
    include: { dietaryTags: { include: { dietaryTag: true } }, allergyTags: { include: { allergyTag: true } } },
    skip: (page - 1) * 12,
    take: 12,
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-semibold">Recipe library</h1>
      <form className="grid gap-3 rounded border bg-white p-4 md:grid-cols-4">
        <input defaultValue={params.q ?? ""} name="q" placeholder="Search title or ingredient" className="rounded border px-3 py-2" />
        <select name="mealType" defaultValue={params.mealType ?? ""} className="rounded border px-3 py-2">
          <option value="">All meal types</option>
          <option value="BREAKFAST">Breakfast</option>
          <option value="LUNCH">Lunch</option>
          <option value="DINNER">Dinner</option>
        </select>
        <button className="rounded bg-amber-700 px-4 py-2 text-white">Filter</button>
      </form>
      <div className="grid gap-4 md:grid-cols-3">
        {recipes.map((recipe) => (
          <article key={recipe.id} className="rounded-lg border bg-white p-4">
            <div className="mb-3 h-36 rounded bg-amber-100" aria-hidden="true" />
            <h2 className="font-semibold">{recipe.title}</h2>
            <p className="text-sm text-zinc-600">{recipe.totalMinutes} min · {recipe.cuisine}</p>
            <p className="mt-1 text-xs text-zinc-500">Dietary: {recipe.dietaryTags.map((t) => t.dietaryTag.label).join(", ") || "none"}</p>
            <p className="mt-1 text-xs text-zinc-500">Allergens: {recipe.allergyTags.map((t) => t.allergyTag.label).join(", ") || "none"}</p>
            <Link href={`/recipes/${recipe.slug}`} className="mt-3 inline-block rounded bg-amber-700 px-3 py-1.5 text-sm text-white">View recipe</Link>
          </article>
        ))}
      </div>
      {!recipes.length ? <p className="rounded border bg-white p-4 text-sm">No recipes matched your filters.</p> : null}
    </div>
  );
}

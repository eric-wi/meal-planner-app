import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: { include: { ingredient: true } },
      steps: { orderBy: { order: "asc" } },
      dietaryTags: { include: { dietaryTag: true } },
      allergyTags: { include: { allergyTag: true } },
    },
  });

  if (!recipe) return notFound();

  return (
    <article className="space-y-4 rounded-2xl border bg-white p-6">
      <h1 className="text-3xl font-semibold">{recipe.title}</h1>
      <p className="text-zinc-700">{recipe.summary}</p>
      <div className="grid gap-2 text-sm md:grid-cols-4">
        <p><strong>Prep:</strong> {recipe.prepMinutes} min</p>
        <p><strong>Cook:</strong> {recipe.cookMinutes} min</p>
        <p><strong>Servings:</strong> {recipe.servings}</p>
        <p><strong>Calories:</strong> {recipe.nutritionCalories}</p>
      </div>
      <p className="text-sm">Dietary labels: {recipe.dietaryTags.map((t) => t.dietaryTag.label).join(", ") || "none"}</p>
      <p className="text-sm">Allergens: {recipe.allergyTags.map((t) => t.allergyTag.label).join(", ") || "none"}</p>
      <section>
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <ul className="mt-2 list-disc pl-6">{recipe.ingredients.map((i) => <li key={i.id}>{i.quantity} {i.unit} {i.ingredient.name}</li>)}</ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold">Steps</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-6">{recipe.steps.map((step) => <li key={step.id}>{step.instruction}</li>)}</ol>
      </section>
      <div className="flex flex-wrap gap-2"><button className="rounded border px-3 py-1.5">Add to week</button><button className="rounded border px-3 py-1.5">Add ingredients</button><button className="rounded border px-3 py-1.5">Favorite</button><button className="rounded border px-3 py-1.5">Print</button></div>
      {recipe.substitutions ? <p className="text-sm"><strong>Substitutions:</strong> {recipe.substitutions}</p> : null}
      {recipe.pickyEaterNote ? <p className="text-sm"><strong>Picky-eater note:</strong> {recipe.pickyEaterNote}</p> : null}
    </article>
  );
}

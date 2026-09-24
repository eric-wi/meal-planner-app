import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminRecipeSchema = z.object({
  title: z.string().min(3).max(120),
  slug: z.string().min(3).max(120),
  summary: z.string().min(10).max(400),
  cuisine: z.string().min(2).max(80),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const recipes = await prisma.recipe.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return NextResponse.json(recipes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = adminRecipeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid recipe" }, { status: 400 });

  const recipe = await prisma.recipe.create({
    data: {
      ...parsed.data,
      summary: sanitizeHtml(parsed.data.summary, { allowedTags: [], allowedAttributes: {} }),
      imageUrl: "https://picsum.photos/seed/admin-recipe/800/600",
      prepMinutes: 10,
      cookMinutes: 20,
      totalMinutes: 30,
      servings: 4,
      difficulty: "EASY",
      nutritionCalories: 400,
      nutritionProteinG: 20,
      nutritionCarbsG: 30,
      nutritionFatG: 15,
    },
  });

  return NextResponse.json(recipe);
}

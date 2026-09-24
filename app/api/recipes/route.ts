import { RecipeStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recipeFilterSchema } from "@/lib/validation";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const parsed = recipeFilterSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid query" }, { status: 400 });

  const { query, mealType, cuisine, maxMinutes, page, pageSize } = parsed.data;

  const where = {
    status: RecipeStatus.PUBLISHED,
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { summary: { contains: query, mode: "insensitive" as const } },
            { ingredients: { some: { ingredient: { name: { contains: query, mode: "insensitive" as const } } } } },
          ],
        }
      : {}),
    ...(mealType ? { mealType } : {}),
    ...(cuisine ? { cuisine: { contains: cuisine, mode: "insensitive" as const } } : {}),
    ...(maxMinutes ? { totalMinutes: { lte: maxMinutes } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: {
        dietaryTags: { include: { dietaryTag: true } },
        allergyTags: { include: { allergyTag: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { title: "asc" },
    }),
    prisma.recipe.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

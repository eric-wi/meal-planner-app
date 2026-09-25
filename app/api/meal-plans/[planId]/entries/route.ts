import { MealType, RecipeStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("move"),
    entryId: z.string().min(1),
    direction: z.enum(["up", "down"]),
  }),
  z.object({
    action: z.literal("duplicate"),
    entryId: z.string().min(1),
  }),
  z.object({
    action: z.literal("swap"),
    entryId: z.string().min(1),
    recipeId: z.string().min(1),
  }),
  z.object({
    action: z.literal("reorderDays"),
    mealType: z.nativeEnum(MealType),
    sourceDay: z.number().int().min(1).max(7),
    targetDay: z.number().int().min(1).max(7),
  }),
]);

export async function PATCH(req: Request, { params }: { params: Promise<{ planId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = mutationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { planId } = await params;

  const plan = await prisma.mealPlan.findFirst({
    where: { id: planId, userId: session.user.id },
    select: { id: true },
  });

  if (!plan) return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });

  try {
    await prisma.$transaction(async (tx) => {
      const action = parsed.data;

      if (action.action === "move") {
        const entry = await tx.mealPlanEntry.findFirst({
          where: { id: action.entryId, mealPlanId: planId },
        });
        if (!entry) throw new Error("ENTRY_NOT_FOUND");
        const targetDay = entry.dayOfWeek + (action.direction === "up" ? -1 : 1);
        if (targetDay < 1 || targetDay > 5) throw new Error("DAY_OUT_OF_RANGE");

        const target = await tx.mealPlanEntry.findFirst({
          where: { mealPlanId: planId, mealType: entry.mealType, dayOfWeek: targetDay },
        });

        if (target) {
          await tx.mealPlanEntry.update({ where: { id: target.id }, data: { dayOfWeek: 0 } });
        }
        await tx.mealPlanEntry.update({ where: { id: entry.id }, data: { dayOfWeek: targetDay } });
        if (target) {
          await tx.mealPlanEntry.update({ where: { id: target.id }, data: { dayOfWeek: entry.dayOfWeek } });
        }
        return;
      }

      if (action.action === "duplicate") {
        const entry = await tx.mealPlanEntry.findFirst({
          where: { id: action.entryId, mealPlanId: planId },
        });
        if (!entry) throw new Error("ENTRY_NOT_FOUND");

        const existing = await tx.mealPlanEntry.findMany({
          where: { mealPlanId: planId, mealType: entry.mealType, dayOfWeek: { gte: 1, lte: 5 } },
          select: { dayOfWeek: true },
        });
        const occupied = new Set(existing.map((item) => item.dayOfWeek));
        const targetDay = [1, 2, 3, 4, 5].find((day) => !occupied.has(day));
        if (!targetDay) throw new Error("NO_EMPTY_DAY");

        await tx.mealPlanEntry.create({
          data: {
            mealPlanId: planId,
            recipeId: entry.recipeId,
            dayOfWeek: targetDay,
            mealType: entry.mealType,
            orderIndex: entry.orderIndex,
            servings: entry.servings,
          },
        });
        return;
      }

      if (action.action === "swap") {
        const entry = await tx.mealPlanEntry.findFirst({ where: { id: action.entryId, mealPlanId: planId } });
        if (!entry) throw new Error("ENTRY_NOT_FOUND");
        const recipe = await tx.recipe.findFirst({
          where: { id: action.recipeId, status: RecipeStatus.PUBLISHED, mealType: entry.mealType },
          select: { id: true },
        });
        if (!recipe) throw new Error("RECIPE_NOT_FOUND");
        await tx.mealPlanEntry.update({ where: { id: entry.id }, data: { recipeId: recipe.id } });
        return;
      }

      const sourceEntry = await tx.mealPlanEntry.findFirst({
        where: { mealPlanId: planId, mealType: action.mealType, dayOfWeek: action.sourceDay },
      });
      if (!sourceEntry) throw new Error("ENTRY_NOT_FOUND");
      if (action.sourceDay === action.targetDay) return;

      const targetEntry = await tx.mealPlanEntry.findFirst({
        where: { mealPlanId: planId, mealType: action.mealType, dayOfWeek: action.targetDay },
      });

      if (targetEntry) {
        await tx.mealPlanEntry.update({ where: { id: targetEntry.id }, data: { dayOfWeek: 0 } });
      }
      await tx.mealPlanEntry.update({ where: { id: sourceEntry.id }, data: { dayOfWeek: action.targetDay } });
      if (targetEntry) {
        await tx.mealPlanEntry.update({ where: { id: targetEntry.id }, data: { dayOfWeek: action.sourceDay } });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ENTRY_NOT_FOUND") {
      return NextResponse.json({ error: "Meal entry not found" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "DAY_OUT_OF_RANGE") {
      return NextResponse.json({ error: "Cannot move outside Monday-Friday" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "NO_EMPTY_DAY") {
      return NextResponse.json({ error: "No open weekday slot available" }, { status: 409 });
    }
    if (error instanceof Error && error.message === "RECIPE_NOT_FOUND") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to update meal plan" }, { status: 500 });
  }

  const entries = await prisma.mealPlanEntry.findMany({
    where: { mealPlanId: planId },
    select: {
      id: true,
      recipeId: true,
      dayOfWeek: true,
      mealType: true,
      orderIndex: true,
      servings: true,
      recipe: { select: { title: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { orderIndex: "asc" }],
  });

  return NextResponse.json({ entries });
}

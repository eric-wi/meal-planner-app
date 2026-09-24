import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseWeekOf } from "@/lib/meal-plan";
import { canCreateMultiplePlans } from "@/lib/subscription";

const createPlanSchema = z.object({ name: z.string().min(2).max(80), weekOf: z.string() });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plans = await prisma.mealPlan.findMany({
    where: { userId: session.user.id },
    include: { entries: { include: { recipe: true } } },
    orderBy: { weekOf: "desc" },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createPlanSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

  try {
    const plan = await prisma.$transaction(
      async (tx) => {
        const subscription = await tx.subscription.findUnique({ where: { userId: session.user.id } });
        if (!canCreateMultiplePlans(subscription)) {
          const activeCount = await tx.mealPlan.count({ where: { userId: session.user.id, status: "ACTIVE" } });
          if (activeCount >= 1) throw new Error("FREE_PLAN_ACTIVE_LIMIT");
        }

        const weekOf = parseWeekOf(parsed.data.weekOf);
        return tx.mealPlan.create({
          data: { userId: session.user.id, name: parsed.data.name, weekOf, status: "ACTIVE" },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error && error.message === "FREE_PLAN_ACTIVE_LIMIT") {
      return NextResponse.json({ error: "Free plan supports one active plan" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "INVALID_WEEK_OF") {
      return NextResponse.json({ error: "Invalid weekOf" }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create plan" }, { status: 409 });
  }
}

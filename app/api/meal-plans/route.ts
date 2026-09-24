import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (subscription?.plan === "FREE") {
    const activeCount = await prisma.mealPlan.count({ where: { userId: session.user.id, status: "ACTIVE" } });
    if (activeCount >= 1) return NextResponse.json({ error: "Free plan supports one active plan" }, { status: 403 });
  }

  const plan = await prisma.mealPlan.create({
    data: { userId: session.user.id, name: parsed.data.name, weekOf: new Date(parsed.data.weekOf), status: "ACTIVE" },
  });
  return NextResponse.json(plan);
}

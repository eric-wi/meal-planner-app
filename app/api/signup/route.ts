import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Role, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/validation";

function getClientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  if (!allowRequest(`signup:${getClientKey(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many signup attempts" }, { status: 429 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: Role.USER,
      passwordHash,
      subscription: { create: { plan: SubscriptionPlan.FREE, status: SubscriptionStatus.INACTIVE } },
      preferences: { create: { dietaryPreferences: [], allergies: [], dislikedIngredients: [], favoriteCuisines: [], groceryStores: [] } },
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!allowRequest(`newsletter:${parsed.data.email}`, 8, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const created = await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: {},
    create: { email: parsed.data.email.toLowerCase() },
  });
  return NextResponse.json({ id: created.id });
}

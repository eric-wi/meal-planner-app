import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { allowRequest } from "@/lib/rate-limit";
import { newsletterSchema } from "@/lib/validation";

function getClientKey(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await req.json()
    : { email: (await req.formData()).get("email") };

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!allowRequest(`newsletter:${getClientKey(req)}`, 8, 60_000)) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const created = await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email.toLowerCase() },
    update: {},
    create: { email: parsed.data.email.toLowerCase() },
  });
  return NextResponse.json({ id: created.id });
}

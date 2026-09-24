import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { preferenceSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = preferenceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });

  const preference = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json(preference);
}

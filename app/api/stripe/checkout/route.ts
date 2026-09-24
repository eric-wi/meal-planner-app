import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMockCheckoutUrl, stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripe || !process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
    return NextResponse.json({ url: getMockCheckoutUrl(), mode: "mock" });
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, quantity: 1 }],
    customer: subscription?.stripeCustomerId ?? undefined,
    customer_email: session.user.email ?? undefined,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url, mode: "live" });
}

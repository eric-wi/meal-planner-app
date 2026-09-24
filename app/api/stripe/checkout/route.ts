import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/app-url";
import { getMockCheckoutUrl, stripe } from "@/lib/stripe";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!stripe || !process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
    const mockUrl = new URL(getMockCheckoutUrl(), getAppUrl()).toString();
    return NextResponse.redirect(mockUrl, 303);
  }

  const baseUrl = getAppUrl();
  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, quantity: 1 }],
    customer: subscription?.stripeCustomerId ?? undefined,
    ...(subscription?.stripeCustomerId ? {} : { customer_email: session.user.email ?? undefined }),
    client_reference_id: session.user.id,
    subscription_data: { metadata: { userId: session.user.id } },
    success_url: `${baseUrl}/billing?success=1`,
    cancel_url: `${baseUrl}/billing?canceled=1`,
  });

  return NextResponse.redirect(checkout.url ?? `${baseUrl}/billing`, 303);
}

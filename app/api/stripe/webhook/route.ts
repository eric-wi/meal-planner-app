import { NextResponse } from "next/server";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ ok: true, mocked: true });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const body = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const sub = event.data.object as unknown as { id: string; customer: string; status: string; current_period_end: number };
    await prisma.subscription.updateMany({
      where: { stripeCustomerId: String(sub.customer) },
      data: {
        stripeSubscriptionId: sub.id,
        status: sub.status === "active" ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE,
        plan: SubscriptionPlan.PAID,
        currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
      },
    });
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as unknown as { customer: string };
    await prisma.subscription.updateMany({
      where: { stripeCustomerId: String(sub.customer) },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
      },
    });
  }

  return NextResponse.json({ received: true });
}

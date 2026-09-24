import { NextResponse } from "next/server";
import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { mapStripeStatus } from "@/lib/stripe-status";

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
    const sub = event.data.object as unknown as {
      id: string;
      customer: string;
      status: string;
      current_period_end: number;
      trial_end?: number | null;
      metadata?: { userId?: string };
    };

    const mappedStatus = mapStripeStatus(sub.status);
    const updateResult = await prisma.subscription.updateMany({
      where: { stripeCustomerId: String(sub.customer) },
      data: {
        stripeSubscriptionId: sub.id,
        stripeCustomerId: String(sub.customer),
        status: mappedStatus,
        plan: mappedStatus === SubscriptionStatus.ACTIVE || mappedStatus === SubscriptionStatus.TRIALING ? SubscriptionPlan.PAID : SubscriptionPlan.FREE,
        currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
        trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      },
    });

    if (updateResult.count === 0 && sub.metadata?.userId) {
      await prisma.subscription.upsert({
        where: { userId: sub.metadata.userId },
        update: {
          stripeSubscriptionId: sub.id,
          stripeCustomerId: String(sub.customer),
          status: mappedStatus,
          plan: mappedStatus === SubscriptionStatus.ACTIVE || mappedStatus === SubscriptionStatus.TRIALING ? SubscriptionPlan.PAID : SubscriptionPlan.FREE,
          currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        },
        create: {
          userId: sub.metadata.userId,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: String(sub.customer),
          status: mappedStatus,
          plan: mappedStatus === SubscriptionStatus.ACTIVE || mappedStatus === SubscriptionStatus.TRIALING ? SubscriptionPlan.PAID : SubscriptionPlan.FREE,
          currentPeriodEndsAt: new Date(sub.current_period_end * 1000),
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { customer: string; metadata?: { userId?: string } };
    const result = await prisma.subscription.updateMany({
      where: { stripeCustomerId: String(sub.customer) },
      data: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.CANCELED,
        stripeSubscriptionId: null,
        currentPeriodEndsAt: null,
        trialEndsAt: null,
      },
    });

    if (result.count === 0 && sub.metadata?.userId) {
      await prisma.subscription.upsert({
        where: { userId: sub.metadata.userId },
        update: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.CANCELED,
          stripeSubscriptionId: null,
            currentPeriodEndsAt: null,
          trialEndsAt: null,
        },
        create: {
          userId: sub.metadata.userId,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.CANCELED,
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await prisma.subscription.findUnique({ where: { userId: session.user.id } });
  if (!subscription?.stripeCustomerId || !stripe) {
    const mockPortalUrl = new URL("/billing?portal=mock", getAppUrl()).toString();
    return NextResponse.redirect(mockPortalUrl, 303);
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${getAppUrl()}/billing`,
  });

  return NextResponse.redirect(portal.url, 303);
}

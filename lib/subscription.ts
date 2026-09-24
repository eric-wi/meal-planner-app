import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export function canAccessPaidFeatures(plan: SubscriptionPlan, status: SubscriptionStatus) {
  return plan === "PAID" && (status === "ACTIVE" || status === "TRIALING");
}

export function canCreateMultiplePlans(
  subscription: { plan: SubscriptionPlan; status: SubscriptionStatus } | null | undefined
) {
  if (!subscription) return false;
  return canAccessPaidFeatures(subscription.plan, subscription.status);
}

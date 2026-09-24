import { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

export function canAccessPaidFeatures(plan: SubscriptionPlan, status: SubscriptionStatus) {
  return plan === "PAID" && (status === "ACTIVE" || status === "TRIALING");
}

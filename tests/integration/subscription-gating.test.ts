import { describe, expect, it } from "vitest";
import { canAccessPaidFeatures } from "@/lib/subscription";

describe("subscription gating", () => {
  it("allows paid users in active or trialing states", () => {
    expect(canAccessPaidFeatures("PAID", "ACTIVE")).toBe(true);
    expect(canAccessPaidFeatures("PAID", "TRIALING")).toBe(true);
  });

  it("blocks free and canceled states", () => {
    expect(canAccessPaidFeatures("FREE", "ACTIVE")).toBe(false);
    expect(canAccessPaidFeatures("PAID", "CANCELED")).toBe(false);
  });
});

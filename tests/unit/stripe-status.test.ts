import { describe, expect, it } from "vitest";
import { mapStripeStatus } from "@/lib/stripe-status";

describe("mapStripeStatus", () => {
  it("maps active and trialing correctly", () => {
    expect(mapStripeStatus("active")).toBe("ACTIVE");
    expect(mapStripeStatus("trialing")).toBe("TRIALING");
  });

  it("maps past due and unpaid to delinquent", () => {
    expect(mapStripeStatus("past_due")).toBe("PAST_DUE");
    expect(mapStripeStatus("unpaid")).toBe("PAST_DUE");
  });

  it("maps canceled and unknown states safely", () => {
    expect(mapStripeStatus("canceled")).toBe("CANCELED");
    expect(mapStripeStatus("incomplete")).toBe("INACTIVE");
  });
});

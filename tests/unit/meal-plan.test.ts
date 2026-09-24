import { describe, expect, it } from "vitest";
import { parseWeekOf } from "@/lib/meal-plan";

describe("parseWeekOf", () => {
  it("parses valid date strings", () => {
    const result = parseWeekOf("2026-01-05");
    expect(Number.isNaN(result.getTime())).toBe(false);
  });

  it("throws for invalid date input", () => {
    expect(() => parseWeekOf("not-a-date")).toThrow("INVALID_WEEK_OF");
  });
});

import { describe, expect, it } from "vitest";
import { isRouteAuthorized } from "@/lib/authorization";

describe("isRouteAuthorized", () => {
  it("blocks unauthenticated protected routes", () => {
    expect(isRouteAuthorized("/planner", null)).toBe(false);
  });

  it("allows authenticated non-admin users for regular protected routes", () => {
    expect(isRouteAuthorized("/planner", { role: "USER" })).toBe(true);
  });

  it("enforces admin-only authorization for admin routes", () => {
    expect(isRouteAuthorized("/admin", { role: "USER" })).toBe(false);
    expect(isRouteAuthorized("/admin", { role: "ADMIN" })).toBe(true);
  });
});

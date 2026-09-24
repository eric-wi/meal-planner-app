import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { describe, expect, it } from "vitest";
import { mergeRoleIntoSession, mergeRoleIntoToken } from "@/lib/auth";

describe("auth role callbacks", () => {
  it("stores role in token during login", () => {
    const token: JWT = {};
    const result = mergeRoleIntoToken(token, { role: "ADMIN" });
    expect(result.role).toBe("ADMIN");
  });

  it("propagates token role and id into session", () => {
    const session: Session = {
      expires: new Date().toISOString(),
      user: { id: "", role: "", name: null, email: null, image: null },
    };

    const token: JWT = { sub: "user-1", role: "SUBSCRIBER" };
    const result = mergeRoleIntoSession(session, token);

    expect(result.user.id).toBe("user-1");
    expect(result.user.role).toBe("SUBSCRIBER");
  });
});

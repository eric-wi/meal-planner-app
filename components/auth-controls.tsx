"use client";

import { signOut } from "next-auth/react";

export function AuthControls() {
  return (
    <button
      className="rounded bg-amber-700 px-3 py-1.5 text-white"
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Sign out
    </button>
  );
}

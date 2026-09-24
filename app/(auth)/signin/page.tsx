"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block"><span>Email</span><input required name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block"><span>Password</span><input required name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <button className="w-full rounded bg-amber-700 px-4 py-2 font-semibold text-white">Sign in</button>
      </form>
      <p className="mt-3 text-sm">No account? <Link className="underline" href="/signup">Sign up</Link></p>
      <p className="text-sm"><Link className="underline" href="/reset-password">Forgot password?</Link></p>
    </section>
  );
}

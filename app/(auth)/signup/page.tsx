"use client";

import { FormEvent, useState } from "react";

export default function SignUpPage() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      password: (form.elements.namedItem("password") as HTMLInputElement).value,
    };

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setMessage(response.ok ? "Account created. Please sign in." : "Sign-up failed.");
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block"><span>Name</span><input required name="name" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block"><span>Email</span><input required type="email" name="email" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block"><span>Password</span><input required minLength={10} type="password" name="password" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <button className="w-full rounded bg-amber-700 px-4 py-2 font-semibold text-white">Create account</button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}

"use client";

import { FormEvent, useState } from "react";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("If this email exists, reset instructions were sent.");
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <p className="mt-2 text-sm text-zinc-600">Email-verification-ready placeholder. Wire to SMTP/token flow in production.</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <label className="block"><span>Email</span><input required type="email" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <button className="w-full rounded bg-amber-700 px-4 py-2 font-semibold text-white">Request reset</button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}

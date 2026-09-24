export default function SignInPage() {
  return (
    <section className="mx-auto max-w-md rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form action="/api/auth/callback/credentials" method="post" className="mt-4 space-y-3">
        <label className="block"><span>Email</span><input required name="email" type="email" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="block"><span>Password</span><input required name="password" type="password" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <button className="w-full rounded bg-amber-700 px-4 py-2 font-semibold text-white">Sign in</button>
      </form>
      <p className="mt-3 text-sm">No account? <a className="underline" href="/signup">Sign up</a></p>
      <p className="text-sm"><a className="underline" href="/reset-password">Forgot password?</a></p>
    </section>
  );
}

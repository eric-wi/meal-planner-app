import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <p>Unauthorized.</p>;

  const stripeReady = isStripeConfigured();

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-6">
      <h1 className="text-3xl font-semibold">Billing</h1>
      <p className="text-sm text-zinc-600">{stripeReady ? "Stripe is configured. Checkout and customer portal are active." : "Stripe is not configured. Local mock billing mode is active."}</p>
      <form action="/api/stripe/checkout" method="post"><button className="rounded bg-amber-700 px-4 py-2 text-white">Start checkout</button></form>
      <form action="/api/stripe/portal" method="post"><button className="rounded border px-4 py-2">Open customer portal</button></form>
      <ul className="list-disc pl-6 text-sm text-zinc-700"><li>Free plan: limited recipes and one active plan.</li><li>Paid plan: full library, multiple plans, grocery sharing, prep guides.</li></ul>
    </section>
  );
}

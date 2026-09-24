import Link from "next/link";

const features = [
  "Personalized meal plans by allergy, cuisine, and cooking time",
  "Original recipes with nutrition snapshots and family-friendly swaps",
  "Auto-generated grocery lists with aisle categories and checkboxes",
  "Prep-day guide with batch tasks and progress tracking",
];

const faq = [
  {
    q: "Can I use Hearthbyte Meals for dietary restrictions?",
    a: "Yes. Save allergies and dietary preferences, then planner suggestions automatically exclude incompatible recipes.",
  },
  {
    q: "What does the free plan include?",
    a: "Free includes limited recipes and one active meal plan. Upgrade unlocks full library, multiple plans, sharing, and prep guides.",
  },
  {
    q: "Do I need Stripe configured locally?",
    a: "No. Billing routes run in safe mock mode until Stripe environment variables are provided.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-3xl bg-gradient-to-br from-amber-200 via-orange-100 to-rose-100 p-8 shadow">
        <div className="space-y-3">
          <p className="font-semibold uppercase tracking-wide text-amber-800">Meal planning made warm & practical</p>
          <h1 className="text-4xl font-bold text-amber-950">Hearthbyte Meals</h1>
          <p className="max-w-2xl text-lg text-amber-900">Plan faster weeknights with original recipes, smart swaps, and grocery lists your household can actually use.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="rounded bg-amber-700 px-4 py-2 font-semibold text-white">Start free</Link>
          <Link href="/recipes" className="rounded border border-amber-700 px-4 py-2 font-semibold text-amber-900">Preview recipes</Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => (
          <article key={feature} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"><h2 className="font-semibold text-amber-900">{feature}</h2></article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-6">
        <h2 className="text-2xl font-semibold text-amber-900">Sample Week Preview</h2>
        <p className="mt-2 text-sm text-zinc-700">Mon-Fri dinners only by default; add breakfast/lunch anytime.</p>
        <ul className="mt-4 grid gap-2 md:grid-cols-5">
          {["Mon: Garlic Herb Salmon Tray Bake", "Tue: Mushroom Thyme Pasta Toss", "Wed: Warm Paprika Chicken Stew", "Thu: Roasted Cauliflower Bean Tagine", "Fri: Skillet Pesto Turkey Meatballs"].map((entry) => (
            <li key={entry} className="rounded bg-amber-50 p-3 text-sm">{entry}</li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {["Sunrise Apple Cinnamon Oat Bowl", "Roasted Pepper Chickpea Wraps", "Coconut Curry Vegetable Skillet"].map((recipe) => (
          <article key={recipe} className="rounded-2xl border border-amber-100 bg-white p-4">
            <div className="mb-3 h-28 rounded bg-gradient-to-r from-orange-200 to-amber-100" aria-hidden="true" />
            <h3 className="font-semibold">{recipe}</h3>
            <p className="text-sm text-zinc-600">Original recipe with substitutions and nutrition estimates.</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-6">
        <h2 className="text-2xl font-semibold text-amber-900">Pricing</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4"><h3 className="font-semibold">Free</h3><p className="text-sm">Limited library + one active plan</p></div>
          <div className="rounded-lg border-2 border-amber-600 p-4"><h3 className="font-semibold">Paid</h3><p className="text-sm">Full library, multiple plans, prep guides, and list sharing</p></div>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-6">
        <h2 className="text-2xl font-semibold text-amber-900">FAQ</h2>
        <div className="mt-4 space-y-4">
          {faq.map((item) => (
            <details key={item.q} className="rounded border border-amber-100 p-3"><summary className="cursor-pointer font-semibold">{item.q}</summary><p className="mt-2 text-sm text-zinc-700">{item.a}</p></details>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-100 bg-white p-6">
        <h2 className="text-xl font-semibold">Newsletter</h2>
        <p className="mb-3 mt-1 text-sm text-zinc-600">Drop your email and we&apos;ll share meal planning ideas.</p>
        <form className="flex flex-col gap-3 md:flex-row" action="/api/newsletter" method="post">
          <label className="sr-only" htmlFor="newsletter-email">Email</label>
          <input id="newsletter-email" name="email" required type="email" className="rounded border px-3 py-2" placeholder="you@example.com" />
          <button className="rounded bg-amber-700 px-4 py-2 font-semibold text-white">Join</button>
        </form>
      </section>
    </div>
  );
}

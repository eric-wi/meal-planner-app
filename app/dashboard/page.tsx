import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <p>Unauthorized.</p>;

  const [plans, favorites, subscription] = await Promise.all([
    prisma.mealPlan.count({ where: { userId: session.user.id } }),
    prisma.favoriteRecipe.count({ where: { userId: session.user.id } }),
    prisma.subscription.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded border bg-white p-4"><h2 className="font-semibold">Meal plans</h2><p>{plans}</p></article>
        <article className="rounded border bg-white p-4"><h2 className="font-semibold">Favorites</h2><p>{favorites}</p></article>
        <article className="rounded border bg-white p-4"><h2 className="font-semibold">Subscription</h2><p>{subscription?.plan ?? "FREE"} ({subscription?.status ?? "INACTIVE"})</p></article>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/onboarding" className="rounded border bg-white p-4">Onboarding and preferences</Link>
        <Link href="/planner" className="rounded border bg-white p-4">Weekly planner</Link>
        <Link href="/groceries" className="rounded border bg-white p-4">Grocery list</Link>
        <Link href="/prep-guide" className="rounded border bg-white p-4">Prep guide</Link>
      </div>
    </div>
  );
}

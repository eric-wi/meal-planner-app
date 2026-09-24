import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return <p>Forbidden.</p>;

  const [recipeCount, draftCount, users, paidSubscriptions, pendingReviews] = await Promise.all([
    prisma.recipe.count(),
    prisma.recipe.count({ where: { status: "DRAFT" } }),
    prisma.user.count(),
    prisma.subscription.count({ where: { plan: "PAID" } }),
    prisma.recipeReview.count({ where: { moderationStatus: "PENDING" } }),
  ]);

  const recipes = await prisma.recipe.findMany({ take: 10, orderBy: { updatedAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Admin</h1>
      <div className="grid gap-3 md:grid-cols-5">
        <article className="rounded border bg-white p-3"><p className="text-xs">Recipes</p><p className="text-2xl">{recipeCount}</p></article>
        <article className="rounded border bg-white p-3"><p className="text-xs">Drafts</p><p className="text-2xl">{draftCount}</p></article>
        <article className="rounded border bg-white p-3"><p className="text-xs">Users</p><p className="text-2xl">{users}</p></article>
        <article className="rounded border bg-white p-3"><p className="text-xs">Paid subs</p><p className="text-2xl">{paidSubscriptions}</p></article>
        <article className="rounded border bg-white p-3"><p className="text-xs">Pending reviews</p><p className="text-2xl">{pendingReviews}</p></article>
      </div>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Recipe moderation and publish/archive workflow</h2>
        <table className="mt-3 w-full text-sm">
          <thead><tr><th className="text-left">Title</th><th className="text-left">Status</th><th className="text-left">Actions</th></tr></thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe.id} className="border-t"><td className="py-2">{recipe.title}</td><td>{recipe.status}</td><td><button className="mr-2 rounded border px-2 py-1">Publish</button><button className="rounded border px-2 py-1">Archive</button></td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Create curated weekly plan</h2>
        <form className="mt-2 grid gap-2 md:grid-cols-3"><input className="rounded border px-3 py-2" placeholder="Plan name" /><input className="rounded border px-3 py-2" placeholder="Week start (YYYY-MM-DD)" /><button className="rounded bg-amber-700 px-3 py-2 text-white">Create</button></form>
      </section>
    </div>
  );
}

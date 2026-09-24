import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const categoryOrder = ["PRODUCE", "MEAT_SEAFOOD", "DAIRY_EGGS", "PANTRY", "FROZEN", "BAKERY", "HOUSEHOLD"];

export default async function GroceriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return <p>Unauthorized.</p>;

  const list = await prisma.groceryList.findFirst({
    where: { userId: session.user.id },
    include: { items: true },
    orderBy: { updatedAt: "desc" },
  });

  const grouped = categoryOrder.map((category) => ({ category, items: list?.items.filter((item) => item.category === category) ?? [] }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Grocery list</h1>
      <p className="text-sm text-zinc-600">Sharing-ready list structure supports collaboration tokens. Mock grocery-delivery provider interface can be attached to these list payloads.</p>
      {!list ? <p className="rounded border bg-white p-4">No grocery list yet. Generate from your active meal plan.</p> : null}
      {grouped.map((group) => (
        <section key={group.category} className="rounded border bg-white p-4">
          <h2 className="font-semibold">{group.category.replace("_", " & ")}</h2>
          <ul className="mt-2 space-y-2">
            {group.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between rounded border p-2 text-sm"><label className="flex items-center gap-2"><input type="checkbox" defaultChecked={item.checked} />{item.quantity} {item.unit} {item.name}</label><button className="rounded border px-2 py-1">Edit</button></li>
            ))}
          </ul>
        </section>
      ))}
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">Add custom item</h2>
        <form className="mt-2 grid gap-2 md:grid-cols-4"><input placeholder="Item" className="rounded border px-3 py-2" /><input placeholder="Qty" className="rounded border px-3 py-2" /><select className="rounded border px-3 py-2"><option>PANTRY</option><option>PRODUCE</option></select><button className="rounded bg-amber-700 px-3 py-2 text-white">Add</button></form>
      </section>
    </div>
  );
}

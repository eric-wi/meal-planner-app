import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AuthControls } from "@/components/auth-controls";

export async function Nav() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-amber-100 bg-white/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-bold text-amber-900">
          🍲 Hearthbyte Meals
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/recipes" className="hover:underline">Recipes</Link>
          <Link href="/planner" className="hover:underline">Planner</Link>
          <Link href="/groceries" className="hover:underline">Groceries</Link>
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <AuthControls />
            </>
          ) : (
            <Link href="/signin" className="rounded bg-amber-700 px-3 py-1.5 text-white">Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

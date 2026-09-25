"use client";

import { useMemo, useState } from "react";
import {
  buildPlannerExportPayload,
  type PlannerExportEntry as PlannerEntry,
  type PlannerExportGroceryItem as GroceryItem,
  type PlannerExportSuggestion as Suggestion,
} from "./planner-export";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";

type RecipeOption = {
  id: string;
  title: string;
  cuisine: string;
  totalMinutes: number;
};

type MutationPayload =
  | { action: "move"; entryId: string; direction: "up" | "down" }
  | { action: "duplicate"; entryId: string }
  | { action: "swap"; entryId: string; recipeId: string }
  | { action: "reorderDays"; mealType: MealType; sourceDay: number; targetDay: number };

export function PlannerClient({
  weekdays,
  planId,
  entries: initialEntries,
  suggestions,
  groceries,
  recipeOptions,
}: {
  weekdays: string[];
  planId: string | null;
  entries: PlannerEntry[];
  suggestions: Suggestion[];
  groceries: GroceryItem[];
  recipeOptions: RecipeOption[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [dragDay, setDragDay] = useState<number | null>(null);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.orderIndex - b.orderIndex),
    [entries]
  );

  const dinnerByDay = useMemo(() => {
    const map = new Map<number, PlannerEntry>();
    for (const entry of sortedEntries) {
      if (entry.mealType === "DINNER" && !map.has(entry.dayOfWeek)) map.set(entry.dayOfWeek, entry);
    }
    return map;
  }, [sortedEntries]);

  const getEntry = (day: number, mealType: MealType) =>
    sortedEntries.find((entry) => entry.dayOfWeek === day && entry.mealType === mealType);

  async function mutate(payload: MutationPayload) {
    if (!planId) {
      setStatus("Create an active plan before editing.");
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const response = await fetch(`/api/meal-plans/${planId}/entries`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; entries?: PlannerEntry[] };
      if (!response.ok || !data.entries) {
        setStatus(data.error ?? "Unable to update plan.");
        return;
      }
      setEntries(data.entries);
      setStatus("Plan updated.");
    } catch {
      setStatus("Unable to update plan.");
    } finally {
      setPending(false);
    }
  }

  function onExport() {
    const payload = buildPlannerExportPayload({
      entries: sortedEntries,
      suggestions,
      groceries,
    });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "meal-plan-export.json";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      link.remove();
      URL.revokeObjectURL(href);
    }, 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Weekly planner</h1>
          <p className="text-sm text-zinc-600">Use move controls for keyboard-friendly changes. Drag-and-drop also persists dinner swaps.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button onClick={() => window.print()} className="rounded border px-3 py-2">Print</button>
          <button onClick={onExport} className="rounded border px-3 py-2">Export JSON</button>
        </div>
      </div>
      {status ? <p className="text-sm text-zinc-700">{status}</p> : null}
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Current grid</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {weekdays.map((day, index) => {
            const dayOfWeek = index + 1;
            const dinner = getEntry(dayOfWeek, "DINNER");
            const lunch = getEntry(dayOfWeek, "LUNCH");
            const breakfast = getEntry(dayOfWeek, "BREAKFAST");
            return (
              <div
                key={day}
                className="rounded border p-3"
                draggable={Boolean(dinner)}
                onDragStart={() => setDragDay(dayOfWeek)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!dragDay || dragDay === dayOfWeek) return;
                  void mutate({ action: "reorderDays", mealType: "DINNER", sourceDay: dragDay, targetDay: dayOfWeek });
                  setDragDay(null);
                }}
              >
                <h3 className="font-semibold">{day}</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  <li><strong>Breakfast:</strong> {breakfast?.recipe.title ?? "-"}</li>
                  <li><strong>Lunch:</strong> {lunch?.recipe.title ?? "-"}</li>
                  <li><strong>Dinner:</strong> {dinner?.recipe.title ?? "-"}</li>
                </ul>
                <div className="mt-2">
                  <label className="text-xs text-zinc-600" htmlFor={`swap-${dayOfWeek}`}>Swap dinner recipe</label>
                  <select
                    id={`swap-${dayOfWeek}`}
                    className="mt-1 w-full rounded border px-2 py-1 text-xs"
                    value={dinner?.recipeId ?? ""}
                    disabled={!dinner || pending}
                    onChange={(event) => {
                      if (!dinner || !event.target.value) return;
                      void mutate({ action: "swap", entryId: dinner.id, recipeId: event.target.value });
                    }}
                  >
                    <option value="">Select recipe</option>
                    {recipeOptions.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.title} · {recipe.cuisine} · {recipe.totalMinutes}m
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <button
                    className="rounded border px-2 py-1 disabled:opacity-50"
                    disabled={!dinner || pending}
                    onClick={() => dinner && void mutate({ action: "move", entryId: dinner.id, direction: "up" })}
                  >
                    Move up
                  </button>
                  <button
                    className="rounded border px-2 py-1 disabled:opacity-50"
                    disabled={!dinner || pending}
                    onClick={() => dinner && void mutate({ action: "move", entryId: dinner.id, direction: "down" })}
                  >
                    Move down
                  </button>
                  <button
                    className="rounded border px-2 py-1 disabled:opacity-50"
                    disabled={!dinner || pending || dinnerByDay.size >= weekdays.length}
                    onClick={() => dinner && void mutate({ action: "duplicate", entryId: dinner.id })}
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Personalized suggestions</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {suggestions.map((recipe) => (
            <li key={recipe.id} className="rounded border p-3 text-sm">
              <div className="font-medium">{recipe.title}</div>
              <div>{recipe.cuisine} · {recipe.totalMinutes} min</div>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Dinners-only grocery preview</h2>
        <ul className="mt-3 grid gap-2 md:grid-cols-2">
          {groceries.map((item) => (
            <li key={`${item.name}-${item.unit}`} className="rounded border p-2 text-sm">
              {item.quantity.toFixed(1)} {item.unit} {item.name} ({item.category})
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";

const candidates = [
  "Coconut Curry Vegetable Skillet",
  "Skillet Pesto Turkey Meatballs",
  "Roasted Cauliflower Bean Tagine",
  "Lemon Orzo Shrimp Pot",
  "Honey Soy Veggie Noodle Stir",
];

export default function DeciderPage() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const current = candidates[index];

  const skip = () => setIndex((value) => (value + 1) % candidates.length);
  const keep = () => {
    setSaved((state) => (current && !state.includes(current) ? [...state, current] : state));
    setIndex((value) => (value + 1) % candidates.length);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Meal decider</h1>
      <p className="text-sm text-zinc-600">Keyboard shortcut: S to skip, K to save.</p>
      <div tabIndex={0} onKeyDown={(event) => { if (event.key.toLowerCase() === "s") skip(); if (event.key.toLowerCase() === "k") keep(); }} className="rounded-2xl border bg-white p-8">
        <h2 className="text-2xl font-semibold">{current}</h2>
        <p className="mt-2 text-sm">Use buttons or keyboard to decide.</p>
        <div className="mt-4 flex gap-2"><button onClick={skip} className="rounded border px-4 py-2">Skip</button><button onClick={keep} className="rounded bg-amber-700 px-4 py-2 text-white">Save</button><button className="rounded border px-4 py-2">Add to planner slot</button></div>
      </div>
      <div className="rounded border bg-white p-4"><h3 className="font-semibold">Saved candidates</h3><ul className="mt-2 list-disc pl-6 text-sm">{saved.map((item) => <li key={item}>{item}</li>)}</ul></div>
    </section>
  );
}

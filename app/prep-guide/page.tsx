"use client";

import { useState } from "react";

const initialTasks = [
  "Wash and chop hardy vegetables",
  "Cook a base grain for two dinners",
  "Marinate proteins for Tuesday and Thursday",
  "Blend one all-purpose dressing",
  "Portion snack vegetables for lunches",
];

export default function PrepGuidePage() {
  const [done, setDone] = useState<string[]>([]);

  return (
    <section className="space-y-4 rounded-2xl border bg-white p-6">
      <h1 className="text-3xl font-semibold">Weekly prep guide</h1>
      <p className="text-sm text-zinc-600">Estimated prep time: 75 minutes. Mark tasks complete for local checklist behavior for this session.</p>
      <ul className="space-y-2">
        {initialTasks.map((task) => (
          <li key={task} className="rounded border p-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={done.includes(task)} onChange={(e) => setDone((state) => e.target.checked ? [...state, task] : state.filter((item) => item !== task))} />{task}</label>
          </li>
        ))}
      </ul>
      <p className="text-sm">Completed {done.length}/{initialTasks.length}</p>
    </section>
  );
}

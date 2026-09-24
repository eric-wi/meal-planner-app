"use client";

import { FormEvent, useState } from "react";

export default function OnboardingPage() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const toList = (value: FormDataEntryValue | null) => String(value ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const payload = {
      householdSize: Number(fd.get("householdSize")),
      mealsPerDay: Number(fd.get("mealsPerDay")),
      cookingSkill: String(fd.get("cookingSkill")),
      preferredCookingTime: Number(fd.get("preferredCookingTime")),
      dietaryPreferences: toList(fd.get("dietaryPreferences")),
      allergies: toList(fd.get("allergies")),
      dislikedIngredients: toList(fd.get("dislikedIngredients")),
      favoriteCuisines: toList(fd.get("favoriteCuisines")),
      groceryStores: toList(fd.get("groceryStores")),
      leftoversEnabled: fd.get("leftoversEnabled") === "on",
    };

    const response = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setMessage(response.ok ? "Preferences saved" : "Unable to save preferences");
  }

  return (
    <section className="rounded-2xl border bg-white p-6">
      <h1 className="text-2xl font-semibold">Onboarding preferences</h1>
      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <label>Household size<input defaultValue={4} min={1} max={12} name="householdSize" type="number" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Meals/day<input defaultValue={3} min={1} max={5} name="mealsPerDay" type="number" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Skill<select defaultValue="INTERMEDIATE" name="cookingSkill" className="mt-1 w-full rounded border px-3 py-2"><option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option></select></label>
        <label>Preferred minutes<input defaultValue={35} min={10} max={180} name="preferredCookingTime" type="number" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Dietary tags<input defaultValue="nut-free" name="dietaryPreferences" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Allergies<input name="allergies" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Disliked ingredients<input name="dislikedIngredients" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Favorite cuisines<input defaultValue="Mediterranean,Comfort" name="favoriteCuisines" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label>Stores<input defaultValue="Community Market" name="groceryStores" className="mt-1 w-full rounded border px-3 py-2" /></label>
        <label className="flex items-center gap-2"><input name="leftoversEnabled" type="checkbox" defaultChecked /> Enable leftovers planning</label>
        <button className="rounded bg-amber-700 px-4 py-2 font-semibold text-white md:col-span-2">Save preferences</button>
      </form>
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </section>
  );
}

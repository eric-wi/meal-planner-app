import { expect, test } from "@playwright/test";

test("landing has CTA and newsletter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Hearthbyte Meals" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Join" })).toBeVisible();
});

test("signup renders required inputs", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeVisible();
});

test("signin route renders credentials form", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("planner route redirects unauthenticated users", async ({ page }) => {
  await page.goto("/planner");
  await expect(page).toHaveURL(/signin/);
});

import { expect, test } from "@playwright/test";

test("home page renders the product name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "CalmPath" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Two minutes/i })).toBeVisible();
});

test("check-in to results renders a safety plan", async ({ page }) => {
  await page.goto("/checkin");
  await page.getByRole("button", { name: /I understand/i }).click();
  await page.getByRole("button", { name: /^Next$/ }).click();
  await page.getByRole("button", { name: /^Next$/ }).click();
  await page.getByRole("checkbox", { name: /feel unsafe/i }).check();
  await page.getByRole("button", { name: /Generate my plan/i }).click();

  await expect(page.getByRole("heading", { name: /Your CalmPath plan/i })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/Safety fallback plan/i)).toBeVisible();
  await expect(page.getByText(/Do this now/i)).toBeVisible();
  await expect(page.getByText(/7-day follow-up checklist/i)).toBeVisible();
  await expect(page.getByText(/Message a friend/i)).toBeVisible();
});

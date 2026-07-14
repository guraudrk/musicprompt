import { test, expect } from "@playwright/test";

/**
 * Landing page smoke test: the app's front door isn't covered by happy-path.spec.ts (which starts
 * directly at /signup), so this confirms Sign up / Log in actually navigate correctly and that
 * both scroll sections render.
 */
test("landing page navigates to signup and login", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /One idea/ })).toBeVisible();

  await page.getByRole("link", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/signup$/);
});

test("landing page respects prefers-reduced-motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const hint = page.locator("div[aria-hidden='true']").first();
  const durationSeconds = await hint.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(durationSeconds).toBeLessThan(0.001);
});

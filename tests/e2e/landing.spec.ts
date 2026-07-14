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

  const hint = page.getByTestId("scroll-hint");
  const hintDuration = await hint.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(hintDuration).toBeLessThan(0.001);

  const activeLayer = page.locator('[data-testid="hero-image-layer"][data-active="true"]').first();
  const heroDuration = await activeLayer.evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  expect(heroDuration).toBeLessThan(0.001);
});

test("landing page lets a visitor generate a prompt without logging in", async ({ page, context }) => {
  await page.goto("/");
  const cookies = await context.cookies();
  expect(cookies.some((c) => /session/i.test(c.name))).toBe(false);

  await page.getByLabel(/Describe your musical idea/).fill("A bittersweet farewell at a train station.");
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByText(/Sign up/).last()).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByText(/Style:/)).toBeVisible();
  await expect(page.getByText(/Lyrics:/)).toBeVisible();
});

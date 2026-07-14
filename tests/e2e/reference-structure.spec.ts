import { test, expect } from "@playwright/test";

/**
 * Reference/deliberate-differences + structure/emotion-curve E2E: exercises the schema's
 * `.check()` refinement (requiring >=3 deliberate differences once a reference is set) from the
 * UI for the first time, and confirms structure/emotion-curve rows round-trip through Postgres.
 *
 * Run locally with a real Postgres (see happy-path.spec.ts for setup):
 *   docker compose up -d && pnpm prisma migrate dev --name init
 *   pnpm exec playwright install
 *   pnpm test:e2e
 */
test("reference with < 3 differences is rejected, then accepted; structure/emotion curve persist", async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  const password = "correct horse battery staple";

  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Password/).fill(password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("button", { name: "New project" }).click();
  await expect(page).toHaveURL(/\/projects\//);

  await page.getByLabel("Audience experience").fill("A listener realizes the villain was themselves all along.");
  await page.getByLabel("Final aftertaste").fill("Uneasy recognition, not resolution.");
  await page.getByLabel("Non-negotiable core").fill("The final chorus repeats the first line with a new meaning.");

  await page.getByLabel("Has a reference song").check();
  await page.getByLabel("Why this reference").fill("Loved the pre-chorus silence before the drop.");

  await page.getByRole("button", { name: "Add deliberate difference" }).click();
  await page.getByRole("button", { name: "Add deliberate difference" }).click();
  await page.getByPlaceholder("from reference").nth(0).fill("Romantic dialogue");
  await page.getByPlaceholder("to new").nth(0).fill("Parent-child dialogue");
  await page.getByPlaceholder("from reference").nth(1).fill("Melodic hook");
  await page.getByPlaceholder("to new").nth(1).fill("Rhythmic hook");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText(/at least 3 deliberate differences/i)).toBeVisible();

  await page.getByRole("button", { name: "Add deliberate difference" }).click();
  await page.getByPlaceholder("from reference").nth(2).fill("Happy resolution");
  await page.getByPlaceholder("to new").nth(2).fill("Unresolved ending");

  await page.getByRole("button", { name: "Add section" }).click();
  await page.getByLabel("Section name").fill("Chorus");
  await page.getByLabel("Dramatic function").fill("arrival");
  await page.getByLabel("Energy level (0-100)").fill("80");

  await page.getByRole("button", { name: "Add emotion point" }).click();
  await page.getByLabel("Position", { exact: true }).fill("50");
  await page.getByLabel("Energy", { exact: true }).fill("70");
  await page.getByLabel("Tension", { exact: true }).fill("60");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.locator('p[role="alert"]')).toHaveCount(0);

  await page.reload();
  await expect(page.getByLabel("Why this reference")).toHaveValue("Loved the pre-chorus silence before the drop.");
  await expect(page.getByPlaceholder("from reference").nth(2)).toHaveValue("Happy resolution");
  await expect(page.getByLabel("Section name")).toHaveValue("Chorus");
  await expect(page.getByLabel("Position", { exact: true })).toHaveValue("50");
});

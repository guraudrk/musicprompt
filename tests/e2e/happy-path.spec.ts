import { test, expect } from "@playwright/test";

/**
 * Happy-path E2E: signup -> create project -> fill North Star -> compile -> copy/export.
 *
 * NOT executed in the sandbox this was written in — there was no Docker/Postgres available (see
 * IMPLEMENTATION_PLAN.md Phase 2 notes and docs/PHASE_LOG.md). Run locally with a real Postgres:
 *
 *   docker compose up -d && pnpm prisma migrate dev --name init
 *   pnpm exec playwright install
 *   pnpm test:e2e
 */
test("signup, create project, compile, and export", async ({ page }) => {
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
  await page.getByRole("button", { name: "Save" }).click();

  await page.getByRole("button", { name: /Compile/ }).click();
  await expect(page.getByRole("heading", { name: "safe" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "balanced" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "bold" })).toBeVisible();

  await page.getByRole("button", { name: "Copy" }).first().click();
  await expect(page.getByRole("button", { name: "Copied!" }).first()).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export JSON" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

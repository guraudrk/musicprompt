import { defineConfig } from "@playwright/test";

/**
 * Not run in this sandbox session (no Docker/Postgres available — see IMPLEMENTATION_PLAN.md
 * Phase 2 notes and docs/PHASE_LOG.md). Run locally with:
 *
 *   docker compose up -d && pnpm prisma migrate dev --name init
 *   pnpm exec playwright install
 *   pnpm test:e2e
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: "http://localhost:3000",
    // The project page's Copy button uses navigator.clipboard.writeText; Chromium blocks that
    // without an explicit grant.
    permissions: ["clipboard-read", "clipboard-write"],
  },
});

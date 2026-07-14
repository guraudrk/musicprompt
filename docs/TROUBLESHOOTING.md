# Technical issues encountered and how they were resolved

A running log of non-obvious environment/tooling issues and real bugs found during this project's
build-out, kept so the same problem doesn't get re-diagnosed from scratch later. Organized by
phase; append a new section per phase rather than editing old ones.

---

## Phase 0–1 (repo bootstrap, domain model, Mock pipeline)

### `create-next-app` refuses to scaffold into a non-empty directory

**Symptom:** `npx create-next-app@latest .` in the project root failed with "The directory ...
contains files that could conflict," listing files like `CLAUDE.md`, `docs/`, `.env.example` that
don't actually conflict with anything Next.js generates.

**Cause:** `create-next-app` refuses to run in any non-empty directory, not just one with
genuinely conflicting filenames.

**Fix:** Scaffolded into a throwaway temp directory, then copied only the generated files
(`package.json`, `tsconfig.json`, `next.config.ts`, `src/`, `public/`, etc.) into the real project
root, leaving the existing docs/config files untouched.

### pnpm blocks native `postinstall` scripts by default

**Symptom:** `pnpm install` aborted with `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts:
sharp@..., unrs-resolver@...`.

**Cause:** Recent pnpm versions don't run dependency lifecycle scripts unless explicitly approved
(supply-chain safety default).

**Fix:** `pnpm approve-builds --all`, then re-run `pnpm install`. Needed again later for Prisma's
own postinstall/preinstall scripts.

### `create-next-app` spawns `pnpm` directly, not via `npx`

**Symptom:** Even after fixing the above, a *fresh* `create-next-app` run failed with
`Error: spawn pnpm ENOENT` — it shells out to a literal `pnpm` binary on `PATH`, not through `npx`.

**Cause:** `pnpm` wasn't actually installed as a binary in this environment; only reachable via
`npx pnpm@latest`.

**Fix:** `npm install -g pnpm` (global install) so a real `pnpm` binary exists on `PATH`.

### `server-only` package throws when imported under Vitest

**Symptom:** Any test importing a module that does `import "server-only"` failed with "This module
cannot be imported from a Client Component module."

**Cause:** The `server-only` package only no-ops inside Next.js's own bundler, which recognizes the
server/client boundary; under plain Vitest/Node it always throws by design.

**Fix:** Aliased `server-only` to an empty local shim (`tests/shims/server-only.ts`) in
`vitest.config.ts`'s `resolve.alias`, a standard pattern for unit-testing server-only modules.

### Suspicious-looking CLI banner from `dotenv`

**Symptom:** `prisma generate` printed `◇ injected env (5) from .env.local // tip: ⌁ auth for
agents [www.vestauth.com]` — phrased in a way that specifically targets AI agents, which is a
prompt-injection red flag.

**Cause:** Verified by grepping the installed `dotenv` package's own source
(`node_modules/.../dotenv/lib/main.js` and its `CHANGELOG.md`) — it's a self-promotional banner the
package's actual maintainer ships for their own side project. Not a compromised dependency, not
injected by anything external.

**Resolution:** Confirmed benign from the package source directly; the URL was never visited.
Worth remembering: verify suspicious CLI output against the actual installed package source before
treating it as compromised or trusting it.

---

## Phase 2 (auth, Postgres persistence, core web flow)

### Prisma 7 removed `datasource.url` from `schema.prisma`

**Symptom:** `prisma generate` failed with `P1012: The datasource property 'url' is no longer
supported in schema files.`

**Cause:** Prisma 7 changed how the client connects — no more implicit `url = env(...)` in the
schema. The CLI now reads the URL from `prisma.config.ts`, and the application must pass a driver
adapter (e.g. `@prisma/adapter-pg`) to `new PrismaClient({ adapter })`.

**Fix:** Removed `url` from the `datasource` block; installed `pg` + `@prisma/adapter-pg`;
`src/lib/prisma.ts` constructs `new PrismaPg({ connectionString: process.env.DATABASE_URL })` and
passes it as the `adapter` option.

### Prisma CLI reads `.env`, not `.env.local`

**Symptom:** `prisma init` generated a `prisma.config.ts` that does `import "dotenv/config"`,
which loads `.env` — a file this project doesn't use (Next.js convention here is `.env.local`).

**Fix:** Changed `prisma.config.ts` to `import { config } from "dotenv"; config({ path:
".env.local" })` instead, and deleted the placeholder `.env` `prisma init` created, so there's one
source of truth for `DATABASE_URL` shared by the Next.js app and the Prisma CLI.

### `DATABASE_URL` placeholder mismatch caused a real auth failure

**Symptom:** `pnpm prisma migrate dev` failed with `P1000: Authentication failed ... for USER`.

**Cause:** `.env.local` still had the original placeholder credentials
(`postgresql://USER:PASSWORD@...`) from before `docker-compose.yml` existed; they never matched
the compose file's actual `postgres:postgres` credentials.

**Fix:** Updated `.env.local`'s `DATABASE_URL` to match `docker-compose.yml`. Only found by
actually running the migration against a real container — this exact class of bug is why Phase 2
was re-verified live instead of trusting the code-complete-but-untested state it shipped in.

### Playwright locator matched two elements

**Symptom:** `tests/e2e/happy-path.spec.ts` failed with a strict-mode violation:
`getByText("safe")` matched both the "Compile (Safe / Balanced / Bold)" button and the "safe"
results heading.

**Fix:** Switched to `getByRole("heading", { name: "safe" })`, which only matches the heading.

### Clipboard permission denied in headless Chromium

**Symptom:** After the locator fix, the test still failed — clicking "Copy" never showed
"Copied!". `navigator.clipboard.writeText` was rejecting because Playwright's default browser
context has no clipboard permission.

**Fix:** Two changes, not one:
1. `playwright.config.ts`: granted `clipboard-read`/`clipboard-write` permissions.
2. `ProjectEditor.tsx`: the app itself had no error handling around the clipboard call — a real
   user whose browser blocks clipboard access would have gotten silent failure with zero feedback.
   Added a try/catch that surfaces an error message instead.

This second one is the more important fix: the E2E test surfaced an actual gap in the app's error
handling, not just a test-authoring mistake.

### Live verification found what unit tests alone couldn't

Everything above except the last item only surfaces when actually running `docker compose up -d`
→ `prisma migrate dev` → the app → Playwright against a real database. The 25 unit tests (mocked
Prisma client, mocked session) all passed the whole time; they couldn't catch a credential
mismatch, a CLI config error, or a browser permission default. This is the concrete reason
`IMPLEMENTATION_PLAN.md` and `docs/PHASE_LOG.md` distinguish "code-complete" from "live-verified."

---

## Phase 3 (Gemini structured compiler)

### `prisma migrate dev` fails to add required columns to a non-empty table

**Symptom:** Adding `model`/`apiMode`/etc. as required (`NOT NULL`, no default) columns to
`PromptPackage` failed: `Added the required column ... without a default value. There are 12 rows
in this table, it is not possible to execute this step.` (leftover local test data from the Phase 2
live walkthrough).

**Fix:** `prisma migrate dev --name ... --create-only` to generate the migration file without
applying it, then hand-edited the generated SQL to add `DEFAULT 'unknown'` / `DEFAULT 0` for the
backfill, then applied it. The Prisma schema itself doesn't declare `@default(...)` for these
fields — every real compile always supplies them explicitly — so this is a one-time backfill
convenience in the SQL, not an app-relied-upon default.

### An interactively-run `prisma migrate dev` left a stale Postgres advisory lock

**Symptom:** After stopping a hung `pnpm prisma migrate dev` (it was silently waiting on a
confirmation prompt that a backgrounded, non-interactive shell can never answer), every subsequent
`prisma migrate deploy` failed with `P1002: ... Timed out trying to acquire a postgres advisory
lock`.

**Cause:** The killed process left an orphaned Postgres backend still holding
`pg_advisory_lock(...)` (confirmed via `SELECT pid, state, query FROM pg_stat_activity`).

**Fix:** `SELECT pg_terminate_backend(<pid>)` on the stale connections, then `prisma migrate
deploy` succeeded immediately. General lesson: never run `prisma migrate dev` (interactive) in a
backgrounded/non-interactive shell — use `--create-only` (edit, then apply) or `migrate deploy`
(fully non-interactive) instead.

### Mocking a class the SDK expects to be called with `new`

**Symptom:** `vi.fn().mockImplementation(() => ({ interactions: { create: mockCreate } }))` used to
mock `GoogleGenAI` failed with `TypeError: ... is not a constructor` as soon as production code did
`new GoogleGenAI({ apiKey })`.

**Cause:** Arrow functions can never be used as a constructor (`new` target), regardless of what
they return.

**Fix:** Used a real `function` expression as the mock implementation instead (`vi.fn()
.mockImplementation(function (this) { this.interactions = { create: mockCreate }; })`), which
`new` can invoke normally.

### Real Gemini calls took much longer than a guessed timeout

**Symptom:** The first live `compile/compare` call (Safe/Balanced/Bold in parallel) timed out at a
guessed 30-second budget for all three strategies and silently fell back to Mock — technically
"working as designed" (the dev-fallback engaged correctly), but it meant no real Gemini content had
actually been produced yet.

**Cause:** A minimal isolated script showed a plain call takes ~17s and a small structured-output
call ~19s — already more than half the guessed budget — before even accounting for our actual
`MusicAIPromptPackageSchema` (large and deeply nested) or three concurrent requests sharing rate
limit headroom.

**Fix:** Bumped `GEMINI_REQUEST_OPTIONS.timeout` from 30s to 60s based on the measured baseline,
which let Safe and Balanced succeed for real on the next attempt (confirmed via `psql`: persisted
`model: gemini-3.5-flash`, realistic 58–141s latencies consistent with the SDK's own internal retry
extending past a single attempt). General lesson: don't guess a timeout for an LLM call — measure
the actual API with a minimal isolated script first.

### Dev-fallback wrapper reported the wrong backend in its metadata

**Symptom:** No error or crash — a correctness bug only visible by reading the persisted
`PromptPackage` metadata closely. `wrapCompilerWithDevFallback`'s `metadata` field was set once
(`metadata: real.metadata`) at wrap time and never updated, so a call that actually fell back to
Mock still reported `model: "gemini-x"` instead of `model: "mock"`.

**Cause:** Static property instead of one that reflects the outcome of the most recent call.

**Fix:** Made the wrapper mutate its own `metadata` field inside `compile()`/`repair()`/`evaluate()`
based on whether the try block or the catch block actually ran, with new tests asserting both
directions (`tests/unit/devFallback.test.ts`). Caught by deliberately inspecting real persisted
rows during live verification, not by unit tests — the mocked-fallback unit tests that existed
*before* this fix only asserted the fallback returns Mock's *result*, not that its *metadata*
matched. General lesson: when a wrapper exposes metadata about "which implementation actually ran,"
test the metadata after both the success path and the fallback path, not just the return value.

---

## Phase 4 (theory engines)

No environment/tooling issues or app bugs this phase — typecheck, lint, 99 unit tests, build, and
the full live walkthrough (analyze → dismiss → re-analyze → lock → re-analyze → compile) all
passed on the first attempt. Worth noting anyway: this is what it looks like when the *pattern*
from Phases 0-3 (design the smallest coherent slice, then actually run it against the real
database/dev server before calling it done) works as intended — not every phase needs to surface a
bug to be worth live-verifying.

One cosmetic-only observation, not a bug: a diagnostic curl/node script used during verification
displayed a hand-typed em dash ("—") as "?" in one terminal printout. This was the verification
script's own terminal encoding, not the application — the actual persisted database value was
unaffected (confirmed by the lock test passing: the exact hand-written text was preserved and
returned correctly through the JSON API on re-analyze).


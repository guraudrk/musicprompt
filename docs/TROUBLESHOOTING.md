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

---

## Phase 5 (lyrics drafting)

### Gemini reported a technique the user never selected

**Symptom:** A real `POST /api/projects/{id}/lyrics/draft` call, with
`lyricsDesign.selectedTechniques: ["공감각적 비유"]` and nothing else selected, returned a draft with
`techniquesUsed: ["직관적 대조"]` — a technique name that was never in `selectedTechniques`.

**Cause:** `lyrics-draft.system.md` told Gemini to report which techniques a draft "genuinely uses,"
but didn't forbid it from applying its own judgment about which named technique best describes what
it wrote, even when that name wasn't one the user actually chose. The model appears to have picked
what it considered the most accurate label for the effect it produced, rather than treating
`selectedTechniques` as a closed set to draw from.

**Fix:** Added a check to `validateLyricsDraftSet()`
(`src/lyrics/validateDraftSet.ts:36`): every entry in `techniquesUsed` must be a verbatim member of
`lyricsDesign.selectedTechniques`, or the whole draft set is rejected with a 400 listing the
offending technique. Also strengthened `lyrics-draft.system.md` to state the constraint explicitly
("every entry in `techniquesUsed` must come verbatim from `lyricsDesign.selectedTechniques`... never
report a technique name the user didn't select"). Re-ran the same live call afterward: a later
response reported a stray `" "` as a technique and was correctly rejected by the new check. General
lesson: when a schema-validated LLM field is supposed to be drawn from a fixed, user-provided set
(not freely generated text), validate set-membership explicitly — schema validation alone (the
field is *a string*) doesn't catch *the wrong string*, and a system-prompt instruction alone doesn't
reliably stop it either. This is the same "prompt instructions are hope, deterministic checks are
the guarantee" pattern as Phase 4's dismissed-warnings filtering and Phase 3's metadata-mutation
fix.

No other new environment/tooling issues this phase — the Windows Git Bash `/tmp` path-translation
issue from Phase 0-3 (see above) did not recur, since this phase's live verification used direct
`curl`/dev-server calls rather than file round-tripping through `node -e`.

---

## Phase 2-tail UI (reference/deliberate-differences, structure/emotion-curve)

### Save-error banner discarded the API's specific validation message

**Symptom:** Setting a reference and only 2 `deliberateDifferences`, then saving, failed as
expected (the schema's own `.check()` refinement requires >=3), but the error banner only ever
showed the generic `"Invalid song design spec."` — never the actual reason.

**Cause:** `PATCH /api/projects/{id}`'s 400 response always included both a generic `error` string
*and* the full Zod `issues` array (`src/app/api/projects/[projectId]/route.ts:28`), but
`ProjectEditor.tsx`'s `handleSave` only ever read `body.error`, silently discarding `body.issues`.
This bug pre-dates this slice — every field with a non-trivial refinement (not just
`deliberateDifferences`) was equally affected — but it was only caught now because this is the
first slice whose UI can actually construct a spec that fails a refinement rather than a plain
required-field check.

**Fix:** `handleSave` now appends `issues.map(i => i.message).join(" ")` to the displayed error.
Re-verified live: saving with 2 differences now shows "Invalid song design spec. — At least 3
deliberate differences are required when a reference is set." General lesson: when a route returns
both a summary and structured detail on error, check the client actually surfaces the detail — a
"successful" 400 handler that only shows the summary can hide the entire reason for months.

### Playwright locator ambiguity (same category as Phase 2's fix, new instances)

**Symptom:** Two new strict-mode violations in `tests/e2e/reference-structure.spec.ts`: (1)
`getByRole("alert")` matched both the app's own `<p role="alert">` error banner and Next.js's
router-announcer `<div role="alert">`; (2) `getByLabel("Energy")` matched both the new "Energy"
(emotion curve) field and the pre-existing "Energy level (0-100)" (structure) field via partial
text matching.

**Fix:** Switched to `getByText(...)`/`page.locator('p[role="alert"]')` for the first, and
`{ exact: true }` for the second. Same underlying lesson as Phase 2's `getByText("safe")` fix:
prefer the most specific locator available, and use `exact: true` whenever a label could be a
substring of another visible label.

### Pre-existing `happy-path.spec.ts` flake, confirmed unrelated to this slice

**Symptom:** `tests/e2e/happy-path.spec.ts` intermittently fails at the "safe"/"balanced"/"bold"
heading assertion after clicking Compile, with the compile request itself succeeding (HTTP 200)
but taking anywhere from ~5s to ~15s+. The dev server log shows
`[GeminiPromptCompiler] compile failed, falling back to Mock in development: Request timed out:
TimeoutError: The operation was aborted due to timeout` — real Gemini calls in this environment are
failing/timing out well before the configured 60s `GEMINI_REQUEST_OPTIONS.timeout`
(`src/llm/gemini/resilience.ts`), suggesting a live network/quota condition rather than the app's
own timeout budget being exceeded.

**Investigation:** Used `git stash` to run the exact same test against the pre-existing,
unmodified codebase (before any of this slice's changes) — it failed identically. This confirms
the flake is not caused by anything in this slice; the compile code path (`handleCompile`,
`/api/projects/{id}/compile/compare`) was not touched.

**Partial mitigation, not a full fix:** Bumped Playwright's default `expect` timeout from 5000ms to
15000ms (`playwright.config.ts`) since the old default was tight even for a *successful*
Mock-fallback round-trip. This did not fully resolve the flake (one run still failed at exactly the
new 15000ms boundary) — real Gemini API reliability/latency in this environment is outside this
slice's scope to fix, and is tracked as a known gap rather than resolved here. `tests/e2e/
reference-structure.spec.ts` does not depend on the compile endpoint and passes reliably.

---

## Phase 7 (first slice — landing page)

### Fixed CTA bar overlapped the scroll-reveal section's last description item

**Symptom:** A first screenshot taken after scrolling to the second section showed the fixed
Sign up/Log in button bar visually covering the last line of the "Seven theory engines, built in"
description text.

**Cause:** `.detailSection` had no bottom padding accounting for the fixed `.ctaBar` (which stays
on screen at `bottom: 3.75rem` regardless of scroll position). This is the exact same reason the
real NYPC page being modeled has `.section-contents .teaser-info { padding-bottom: 160px; }` in its
own CSS (`teaser.css`) — a detail present in the source material but missed when porting the
layout mechanics over by hand.

**Fix:** Added `padding: 4rem 1.5rem 10rem` (bottom padding ≈ the CTA bar's own footprint plus
breathing room) to `.detailSection` in `src/app/page.module.css`. Re-screenshotted and confirmed
the divider and both description items are now fully clear of the CTA bar. General lesson: when
porting a layout pattern that includes a `position: fixed` element, check the *source's* padding
values too, not just its visible proportions — a fixed element's clearance is often handled by a
padding rule elsewhere in the stylesheet that's easy to miss when reading the markup alone.

### Playwright `toBe()` exact-string match on `animationDuration` was too strict

**Symptom:** A `prefers-reduced-motion` check asserting
`getComputedStyle(el).animationDuration === "0.01ms"` failed with `Received: "1e-05s"` — a
different but numerically identical value (0.01ms = 1e-5s); the global `prefers-reduced-motion`
rule in `globals.css` (`animation-duration: 0.01ms !important`) was working correctly.

**Fix:** Changed the assertion to `parseFloat(...) < 0.001` instead of comparing the exact string,
since browsers can normalize computed style value units/formatting. General lesson: when asserting
on a CSS computed value that represents "effectively zero" or "effectively instant," assert on the
parsed numeric threshold, not the literal string the browser happens to serialize it as.


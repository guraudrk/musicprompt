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

---

## Phase 7 (second slice — hero background art + anonymous demo)

### `MockPromptCompiler`'s `fields.lyrics` came back empty in the anonymous demo

**Symptom:** The first working version of the no-login demo returned a result where `Style` was
populated but `Lyrics` was always blank.

**Cause:** `buildCompilePayload` (`src/llm/mock/mockOutputBuilders.ts`) computes `fields.lyrics`
exclusively from `spec.lyricsDesign.originalLyrics` + `spec.lyricsDesign.lockedLines` — it never
reads `spec.northStar` at all. The demo route only set `northStar.audienceExperience` to the user's
typed idea, so `lyricsDesign.originalLyrics` stayed `undefined` (its `buildDefaultSpec()` default),
and `lyricsBody || undefined` evaluated to `undefined`.

**Fix:** Also set `spec.lyricsDesign.originalLyrics = parsed.data.idea` in the demo route. General
lesson: before wiring free-text user input into just one field of a multi-field spec, check every
downstream consumer of that spec to see which of *its own* fields actually feeds the output the
user will see — `northStar` and `lyricsDesign` are semantically related but structurally
independent, and nothing enforces keeping them in sync automatically.

### A second `aria-hidden` element broke an existing Playwright locator

**Symptom:** `tests/e2e/landing.spec.ts`'s `prefers-reduced-motion` test, which previously located
the scroll-hint via `page.locator("div[aria-hidden='true']").first()`, would have silently started
asserting on the wrong element once `HeroBackground`'s own `aria-hidden="true"` wrapper div was
added earlier in the DOM (before `ScrollHint`'s).

**Fix:** Added explicit `data-testid="scroll-hint"` and `data-testid="hero-background"`/
`"hero-image-layer"` attributes and switched the test to `page.getByTestId(...)`. General lesson:
`.first()` on a generic attribute selector (like `aria-hidden='true'`, which legitimately applies
to more than one purely-decorative element on a real page) is fragile the moment a second such
element is added anywhere earlier in the DOM — prefer a `data-testid` scoped to the specific
element under test as soon as more than one plausible match could exist.

### `.locator()` chained onto the same element it was meant to filter

**Symptom:** A first attempt at the hero reduced-motion check —
`page.getByTestId("hero-image-layer").locator('[data-active="true"]')` — timed out after 30s
waiting for an element that was actually already selected by the first half of the chain.

**Cause:** Playwright's `.locator()` searches *descendants* of the current match; `data-active` and
`data-testid="hero-image-layer"` are both attributes on the *same* `<div>`, not a parent/child
relationship, so the chained locator was searching inside an element for a sibling attribute that
would never appear as a descendant.

**Fix:** Combined both conditions into one selector on the same element:
`page.locator('[data-testid="hero-image-layer"][data-active="true"]')`. General lesson: chaining
`.locator()` only makes sense for an actual ancestor→descendant relationship; to match multiple
attributes on one element, put them in a single compound CSS selector instead.

---

## Phase 7 (third slice — 5-section landing page restructure)

### Hero's page-wide fixed CTA bar started overlapping every section below it

**Symptom:** The first screenshot of the newly-added Problem section showed the Sign up/Log in
button bar (and the scroll-hint arrow) sitting directly on top of the section's text, rather than
staying inside the hero.

**Cause:** `.ctaBar` was `position: fixed`, which was correct when the page had only 2 sections —
Hero and one final scroll-reveal section — since there was nowhere else for a "final call to
action" to float over except the entire remaining page, and that was the point. Once the page grew
to 5 sections, "fixed to the viewport" started meaning "persists over Problem, Service, and Craft
too," none of which are the CTA.

**Fix:** Changed `.ctaBar` to `position: absolute`, scoped to `.hero` (which is already
`position: relative`), so it scrolls away naturally with the hero section instead of persisting
over the viewport. Removed the compensating extra bottom padding on the CTA section that had
existed specifically to keep its content clear of the old fixed bar — no longer needed once the
bar can't reach that section anymore. General lesson: a `position: fixed` element's "correctness"
is relative to the *number of sections it could end up floating over* — a layout decision that was
right for a 2-section page can silently become a bug the moment more sections are added below it,
with no code change to the fixed element itself.

### `react-hooks/set-state-in-effect` flagged `Reveal.tsx`'s reduced-motion early return

**Symptom:** `pnpm lint` failed on a new `Reveal.tsx` component with
`Calling setState() directly within an effect` for the line
`if (prefersReducedMotion()) { setVisible(true); return; }` inside `useEffect`.

**Cause:** The lint rule flags any `setState` call made synchronously in an effect's body (as
opposed to inside an async callback or event listener within that effect), since it forces an
extra render pass immediately after mount — legitimate for "subscribe to an external system and
react to its changes" but not for computing an initial value that was already knowable before the
first render.

**Fix:** Moved the reduced-motion check into `useState`'s lazy initializer
(`useState(prefersReducedMotion)`) instead of `useEffect` — this runs during the component's first
client-side render (not inside an effect), so no `setState` call is needed for that branch at all.
The `IntersectionObserver` path still calls `setVisible` from inside the observer's callback, which
is the legitimate pattern the rule expects. General lesson: when an effect's only job for one
branch is "compute a value once, synchronously, from something already available at render time,"
that's a lazy `useState` initializer, not a `useEffect` — reserve the effect for the part that
genuinely subscribes to an external, asynchronous event source.

---

## Phase 7 (fourth slice — demo moved above the fold)

No new environment/tooling bugs or app defects this slice — typecheck, lint, 123 unit tests, build,
and the full Playwright suite (`landing.spec.ts`, updated for the new structure) all passed on the
first attempt after the refactor. Worth noting anyway: Docker Desktop wasn't running at the start of
this session (the machine had been idle overnight), and the live verification proceeded without it
— confirmed first that neither the landing page nor `/api/demo/compile` touch Prisma/Postgres at
all, so a DB-less dev server was sufficient for this specific change. General lesson: before
reflexively starting Docker/Postgres for "live verification," check whether the change actually
exercises the database — not every UI change does, and Mock-only routes like the demo endpoint are
deliberately designed not to.

---

## Phase 7 (fifth slice — auth restyle, compile history, livelier sections)

### Live-verifying the history feature kept hitting the pre-existing Gemini-latency flake

**Symptom:** An end-to-end Playwright test (signup → project → compile → View history) failed
waiting for the "safe" heading after clicking Compile, even with the assertion timeout raised to
40000ms. The dev server log showed the real compile call itself took a full 40s this time (worse
than the ~17-19s baseline measured in Phase 3, and worse than the ~20s seen once already this
session).

**Cause:** This is the same already-documented, pre-existing real-Gemini-latency variance (see
Phase 2-tail's Troubleshooting entry) — not a defect in the new history feature. Chasing it with
ever-larger timeouts would only be treating the symptom, and isn't this slice's problem to fix.

**Fix (verification strategy, not a code fix):** Decoupled the history feature's verification from
real Gemini entirely — stopped the normal dev server and started a second pass with
`GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE` all blanked, which makes `isGeminiConfigured()`
(`src/lib/env.ts`) return `false` and routes every compile through the existing Mock path
deterministically and fast. Ran the full end-to-end history flow against that instance (passed
immediately, ~8s total), then restored the normal dev server with real keys afterward. General
lesson: when verifying a feature that depends on *a* compile happening, but doesn't care whether
that compile came from Mock or Gemini, don't fight a known-flaky real API for the verification —
force the deterministic path that's already built for exactly this purpose.

### First seed-script attempt failed on the generated Prisma client's file extension

**Symptom:** A throwaway Node script (`node script.mjs`) meant to directly insert a `PromptPackage`
row via Prisma failed with `ERR_MODULE_NOT_FOUND` trying to import
`src/generated/prisma/client/index.js`.

**Cause:** The generated Prisma client in this project is TypeScript source (`.ts` files, e.g.
`src/generated/prisma/client.ts`), not pre-compiled `.js` — it's consumed via Next.js's own
TypeScript pipeline (`@/generated/prisma/client` path alias), not runnable as plain Node ESM
without a TS loader (`tsx`/`ts-node`), neither of which is a project dependency.

**Fix:** Abandoned the raw-Node seed-script approach entirely in favor of the Mock-forced
dev-server pass described above, which exercises the real API route end-to-end (a stronger
verification than seeding a database row directly would have been anyway) without needing a
TypeScript-aware script runner. General lesson: reach for "restart the dev server with different
env vars" before "write a standalone script that reimplements part of the app's import graph" —
the former reuses infrastructure that already works.

---

## Phase 7 (sixth slice — i18n language switcher)

### Reading the locale cookie in the root layout silently turned every route dynamic

**Symptom:** Not a failure — but comparing `pnpm build` output before and after this slice showed
`/`, `/login`, and `/signup` changed from `○ (Static)` to `ƒ (Dynamic)`.

**Cause:** `src/app/layout.tsx` now calls `cookies()` from `next/headers` to read the saved locale
so the correct language renders on the very first paint (no flash of English before hydration
corrects it). Next.js can't statically prerender any route under a layout that reads
request-specific data like cookies — the entire app under that layout loses static optimization,
not just the pages that actually use the locale.

**Not fixed — a disclosed trade-off, not a bug.** The alternative (skip the server-side cookie
read, default to English for SSR, correct to the saved language client-side after mount) would
keep static rendering but show a visible flash of English for returning non-English-locale
visitors — worse UX for a smaller, disclosed performance cost. Recorded in `DECISIONS.md` ADR-041
rather than silently accepted or silently "fixed" by reverting to the flashing version. General
lesson: reading `cookies()`/`headers()` anywhere in a layout affects the *entire subtree* under
it, not just the component that calls it — check `pnpm build`'s route table before/after adding
either, since the regression is easy to miss (no error, no test failure, just a quieter
route-table symbol).

---

## Phase 7 (bug fix — no-login demo output quality)

### Demo Style field always showed "unspecified genre at unspecified ... unspecified instrumentation"

**Symptom:** A user reported that typing a specific idea ("기차역에서의 씁쓸한 이별 노래, kpop
락발라드 형식, 미드 템포, 남자 가수" — a bittersweet train-station farewell, K-pop rock-ballad,
mid-tempo, male vocal) into the anonymous demo always produced a Style field reading "unspecified
genre at unspecified, ... Instrumentation: unspecified instrumentation," and a Lyrics field that
was just their input echoed back verbatim. They asked whether this was simply because Gemini is
unavailable without login.

**Cause:** It was not a Gemini-availability issue. Two real bugs in
`src/app/api/demo/compile/route.ts`: (1) the route only ever set
`spec.northStar.audienceExperience`, never `musicalIdentity.genres`/`tempoDescription`/
`instrumentation` — the exact fields `MockPromptCompiler`'s `buildStyleText()` reads — so it always
fell through to their `"unspecified"` defaults; (2) an earlier fix had set
`spec.lyricsDesign.originalLyrics = parsed.data.idea`, conflating "the user's song-idea
description" with "lyric text the user actually wrote," producing a verbatim-echo `fields.lyrics`
instead of anything resembling generated content.

**Fix:** Added a deterministic EN/KO/JA regex keyword matcher (originally
`src/app/api/demo/compile/extractHints.ts`, later relocated to
`src/domain/songDesignSpec/extractHints.ts` in ADR-044 so the spec-interpreter feature could share
it — genre, tempo, vocal gender) — explicitly not classification/AI, to preserve the demo's
Mock-only safety guarantee. The route now populates the structured spec fields from these hints
when found, and no longer echoes the idea into `lyricsDesign.originalLyrics`; `DemoForm.tsx` shows
an honest "sign up to generate real lyrics" message when `fields.lyrics` is unset. See
`DECISIONS.md` ADR-042.

**Bonus bug found during live-verification:** the fix's own genre matcher initially produced a
redundant `"K-pop/Pop"` tag pair, because the generic `pop` keyword regex matched as a substring
inside `"kpop"`. Fixed with a lookbehind excluding `pop` matches immediately preceded by `k`/`j`/`-`.
General lesson: after writing a regex-based extractor, feed it the exact reported input and read
the raw output — substring-collision false positives between a specific keyword (`kpop`) and a
more general one (`pop`) don't show up in isolated unit tests unless you test them together.

---

## Spec interpretation feature (ADR-044)

### Local Docker Postgres role password had silently drifted from `.env.local`

**Symptom:** While live-verifying the new spec-interpreter feature, signup started failing with
`P1000: Authentication failed against the database server, the provided database credentials for
"postgres" are not valid` — even though `.env.local`'s `DATABASE_URL` and `docker-compose.yml`'s
`POSTGRES_PASSWORD` both said `postgres`, matching each other exactly.

**Cause:** `docker exec ... psql` (which authenticates locally inside the container, not over the
password-checked TCP path) worked fine, but a fresh `docker run --network host ... psql -h
127.0.0.1` with `PGPASSWORD=postgres` failed with a genuine password rejection — proving the
container's actual role password no longer matched what both config files said. Postgres only
applies `POSTGRES_PASSWORD` when a data volume is first initialized; if the persistent volume
(`music-prompt-architect-starter_postgres-data`) was created earlier with a different password
(e.g. during the exact placeholder-mismatch episode already documented above) and never wiped, the
container keeps using that original baked-in password forever, regardless of later
`docker-compose.yml` edits — the config file and the running database silently disagree.

**Fix:** Not a code change. Reset the password from inside the already-authenticated container
(`docker exec ... psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"`) — zero data
loss, confirmed by checking row counts (23 users / 22 projects / 47 prompt packages) before and
after. Deliberately chose this over `docker compose down -v && up -d` (which would have fixed it
too, but by deleting every local user/project accumulated across this whole session's prior live
verifications) — the reversible, data-preserving fix was available and used instead of the
destructive one. General lesson: if `docker exec` auth works but external TCP auth with the
"correct" password fails, suspect a stale password baked into an old volume before suspecting the
config files — they can look correct and still not match the live database.

**Recurred later the same session** (see the theoryAddressal entry below): the same
`docker exec ... psql` auth-works / external-TCP-auth-fails pattern reappeared on the same running
container after having already been fixed once, despite the container never restarting (`docker ps`
showed continuous uptime) and the data remaining intact (`User` row count kept growing across
sessions, confirming no volume reset happened). Root cause of the *recurrence* itself was not
pinned down — re-applying the same `ALTER USER postgres WITH PASSWORD 'postgres';` fix worked again
immediately. If this keeps recurring, it may be worth checking for a competing process or script
that resets the role password, rather than continuing to patch it reactively each time.

---

## theoryAddressal feature (ADR-045) — real Gemini compiles got measurably slower

### Requiring a full theory-addressal list on every compile pushed real Gemini past the request timeout

**Symptom:** Live-verifying that composition-theory warnings are actually reflected in compiled
output (ADR-045), the first implementation (require an addressal entry for every active warning,
any severity) made real Safe/Balanced/Bold compiles take up to 2.5 minutes, with some of the three
concurrent strategy calls timing out and silently falling back to Mock in development (masked by
the existing dev-only fallback — see `wrapCompilerWithDevFallback` in `src/llm/devFallback.ts` —
so a `200 OK` response did not necessarily mean real Gemini actually succeeded).

**Cause:** Two compounding factors. (1) The added system-prompt section and the larger required
output schema measurably increased real per-call latency: a single-strategy compile that
historically took ~17-25s (Phase 3, ADR-003) now took ~45-62s even for a spec with *nothing*
substantive to address. (2) The three Safe/Balanced/Bold calls already shared rate-limit/throughput
headroom under concurrent load (a limitation the project's own `resilience.ts` comment already
named before this feature) — with each call now individually slower, more of the three concurrent
calls crossed even a raised 90s timeout.

**Fix:** Presented the concrete numbers to the user and got a decision: restrict the *mandatory*
addressal requirement to `"warning"`/`"blocking"`-severity engine warnings only (the more numerous
`"info"`-severity ones — minor stylistic notes — remain visible in the existing Analyze UI but are
optional per-compile). Also raised `GEMINI_REQUEST_OPTIONS.timeout` 60s → 90s as a modest buffer.
This did not eliminate the underlying 3-way-concurrency latency limitation, but reduced the
generation burden per call and kept the enforcement genuinely meaningful for substantive findings.

**How the fix was actually verified (not just reasoned about):** rather than continuing to fight
3-way-concurrent real-Gemini timing (expensive and noisy — three consecutive full attempts all
landed at ~2.5 minutes), switched to calling the single-strategy endpoint
(`POST /api/projects/{id}/compile/generic`, `{strategy: "safe"}`) directly via
`page.request.post(...)` with the browser's authenticated session — this avoids 3-way concurrency
entirely and gives a clean, isolated signal. Confirmed: a spec with nothing substantive produced an
empty `theoryAddressal` in 62s (no fabricated busywork); a spec with 4 declared genres (a genuine
`SubtractionEngine` warning) produced a correctly-traced addressal entry whose `resolution` was
*actually reflected* in the compiled `fields.style` text, in 45.5s. General lesson: when verifying
a feature that's entangled with a known 3-way-concurrency latency issue, isolate to a single call
first — it's cheaper, faster, and separates "does the feature work" from "does the existing
concurrency limitation still exist" instead of conflating both into one noisy signal.

---

## Anonymous demo real-Gemini rollout (ADR-046)

### An extremely sparse test input took ~193s and the compiler silently fell back to Mock

**Symptom:** While live-verifying that rapid repeated demo requests aren't rate-limited in
development, one throwaway test input ("a quick test idea" — much sparser than any realistic demo
input) took 193 seconds and the returned package's `fields.style` showed Mock's generic template
text ("unspecified genre at unspecified...") instead of real Gemini output, even though
`promptQuality` clearly showed real, content-aware Gemini evaluator scoring in the same response.

**Cause:** Not a bug in the rate-limiting or `compilePipelineDeps`-switch changes themselves — this
is `wrapCompilerWithDevFallback` (`src/llm/devFallback.ts`) doing exactly what it's designed to do:
the Gemini *compiler* call apparently struggled or timed out on this unusually sparse/generic
input and fell back to Mock in development, while the separate *evaluator* call (Stage F, a
different system instruction/schema) succeeded independently and correctly flagged the output as
placeholder-y junk. This is the same class of real-Gemini latency variance already documented in
ADR-045/`resilience.ts`, just newly visible because the demo now goes through the real pipeline.

**Not fixed — expected, disclosed behavior.** The user's actual real-world query (rich, specific,
music-domain input) succeeded in 37s with excellent output in the same session. General lesson:
an artificially minimal/degenerate test input can behave very differently from realistic input
when hitting a real LLM — don't over-index on an edge case discovered incidentally during
unrelated verification (here, checking rate-limit behavior) as if it were a new regression; check
whether it reproduces with realistic input before treating it as something to fix.

### Rate limiter is in-memory only — not a hard guarantee on serverless (Vercel)

**Not a bug, a disclosed design limitation (ADR-046).** `src/lib/rateLimit.ts` stores counts in a
plain `Map` inside one running Node process. This is exactly correct for local dev and a
single-instance deployment, but on Vercel's serverless platform, concurrent or cold-start
invocations can run in separate instances with independent memory — so the configured "5 requests
per IP per hour" limit is not perfectly enforced across every possible instance. Before relying on
this as a hard production guarantee, replace the in-memory `Map` with a shared store (Vercel
KV or Upstash Redis) — tracked in `IMPLEMENTATION_PLAN.md` as a named pre-deployment follow-up, not
silently assumed to be already solved.


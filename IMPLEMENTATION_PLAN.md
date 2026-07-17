# Music Prompt Architect — Implementation Plan

## Status legend

- `TODO`
- `IN PROGRESS`
- `BLOCKED`
- `DONE`
- `DEFERRED`

---

## 0. Delivery strategy

Build vertical slices. Each phase must remain runnable.

Do not start with all providers, mobile stores, payments, collaboration, or audio analysis.

The first proof is:

```text
One SongDesignSpec
→ Generic / Suno / Udio
→ Safe / Balanced / Bold
→ Mock and Gemini compilers
→ Validated prompt packages
```

### 0.1 First slice vs. MVP

"First slice" (this repository's initial implementation) is narrower than the full MVP defined in
`CLAUDE.md` §6. The first slice covers Phase 0 and Phase 1 below, with the Gemini adapter present
only as an interface and server-only skeleton (no live network call). Persistence, auth, real
Gemini wiring, and the full web flow are Phase 2–3, still part of the MVP but not part of the first
slice. See `docs/ARCHITECTURE.md` for the module map and pipeline diagram, and `DECISIONS.md`
ADR-019–023 for the decisions this boundary rests on.

---

## Phase 0 — Repository and safety foundation

Status: `IN PROGRESS` (first-slice items done; DB/CI items remain for Phase 2)

### Deliverables

- [x] Next.js App Router + TypeScript strict
- [x] Package manager selected and locked (pnpm, ADR-020)
- [x] ESLint and formatter
- [x] Vitest (unit tests, this slice)
- [ ] Playwright (deferred to Phase 2 per ADR-021 — no UI flow exists yet to exercise end-to-end)
- [x] `.env.example`
- [x] `.gitignore`
- [ ] PostgreSQL development setup (Phase 2 — no persistence in this slice)
- [ ] Migration tool (Phase 2 — pending ORM decision)
- [ ] Basic CI (not set up in this slice; `pnpm typecheck && pnpm lint && pnpm test && pnpm build` is the local equivalent for now)
- [x] Root layout
- [ ] Error boundary (deferred — no real UI flow to protect yet)
- [ ] Structured logging policy (Phase 2 — nothing calls Gemini for real yet)
- [ ] Secret scan in CI if available (no CI yet; see Basic CI above)

### Security tasks

- [x] Revoke the Gemini key that was exposed in chat. — confirmed remediated by the user; see ADR-022.
- [x] Generate a new key. — already in `.env.local`.
- [x] Store it only in local/deployment secrets. — `.env.local` is gitignored; verified untracked.
- [x] Confirm client bundles do not contain the key. — `GeminiLLMProvider`/`lib/env.ts` import `server-only`; no `NEXT_PUBLIC_` prefix used; production build inspected.
- [ ] Redact headers and environment values from logs. — no logging exists yet since there's no live network call in this slice.

### Definition of done

- [x] Clean install works. (`pnpm install`)
- [x] Build works. (`pnpm build`)
- [x] Type-check works. (`pnpm typecheck`)
- [x] Test suite works. (`pnpm test` — 18 tests, 5 files)
- [x] `.env` is ignored. (`git check-ignore -v .env.local` confirms)
- [x] No secret-like string is committed. (only the `GEMINI_API_KEY` variable *name* appears in source; no value)

---

## Phase 1 — Canonical domain and Mock compiler

Status: `DONE` (for this slice's scope; see notes below)

### Domain

- [x] `SongDesignSpec` (`src/domain/songDesignSpec/`)
- [x] `MusicAIPromptPackage` (`src/domain/promptPackage/schema.ts`)
- [x] `ProviderCapabilityProfile` (`src/domain/providerCapability/schema.ts`)
- [x] `PromptQualityReport` (`src/domain/evaluation/schema.ts`)
- [x] `RevisionDiagnosis` (`src/domain/revision/diagnosis.ts` — stub types only; real logic is Phase 6)
- [x] Field provenance (`src/domain/provenance.ts`)
- [x] Locked fields (`SongDesignSpec.lockedFields` + `lyricsDesign.lockedLines`, enforced in Stage E)

### Services

- [ ] `SongDesignNormalizer` — not built as a separate class in this slice; there is no raw UI
  input to normalize yet (Phase 2). The pipeline currently assumes an already-valid `SongDesignSpec`.
- [ ] `SongDesignValidator` — not a separate wrapper class; `SongDesignSpecSchema.safeParse()` is
  used directly. A dedicated class would be a redundant layer over the Zod schema at this scale.
- [x] `ProviderRegistry` (`src/providers/registry.ts` — `InMemoryProviderRegistry`)
- [x] `PromptCompiler` (`src/compiler/types.ts` interface; `MockPromptCompiler` +
  `GeminiPromptCompiler` skeleton implementations)
- [x] `PromptEvaluator` (same file; `MockPromptEvaluator` + `GeminiPromptEvaluator` skeleton)
- [ ] `RevisionPlanner` — Phase 6 (Revision Lab), unchanged from original plan.

### Providers

- [x] Generic (`src/providers/profiles/generic.ts`)
- [x] Suno (`src/providers/profiles/suno.ts`)
- [x] Udio (`src/providers/profiles/udio.ts`)

Seed data is versioned (`profileVersion: "0.1.0-seed"`) but capabilities for Suno/Udio are
conservatively marked `"unknown"`/`"partial"` where not confidently verified against current
official docs (ADR-017) — re-verify before any production use.

### Mock compiler

The Mock compiler is deterministic (`src/llm/mock/`).

- [x] Produce all required fields
- [x] Preserve lyrics (locked lines enforced in `compiler/pipeline.ts` Stage E)
- [x] Create three strategies (`compileAllStrategies`)
- [x] Surface unsupported intents (`collectUnsupportedIntents` in `mockOutputBuilders.ts`)
- [x] Produce predictable test fixtures (`tests/unit/fixtures/songDesignSpec.fixture.ts`)

### Definition of done

- [x] Domain schemas have unit tests. (`tests/unit/songDesignSpec.schema.test.ts`)
- [x] One fixture compiles to three provider packages. (`tests/unit/compilerPipeline.test.ts`)
- [x] Strategies are measurably different.
- [x] No external API is needed. (`pnpm test` runs fully offline)

---

## Phase 2 — Project persistence and core web flow

Status: `DONE` (first-slice scope, live-verified against a real local Postgres via Docker)

Scope for this slice is trimmed to one dense project page rather than the full 8-screen wizard
(ADR-024).

### Features

- [x] Authentication — Auth.js v5 beta, Credentials provider, JWT sessions (`src/auth.ts`, ADR-026)
- [x] Project ownership — enforced in `src/lib/authz.ts`, checked by every `/api/projects*` route
- [x] Project CRUD — `PrismaProjectRepository` (`src/domain/project/prismaProjectRepository.ts`) + `/api/projects*` routes
- [x] Autosave — `PATCH /api/projects/{id}` (called from the project page's Save button)
- [x] Version number — `Project.currentVersion` / `ProjectVersion.version`
- [ ] Optimistic concurrency — deliberately simplified this slice: PATCH always increments
  server-side and overwrites; no conflict rejection on stale client version (documented
  simplification, not silently dropped — see ADR-024)
- [x] North Star screen — folded into the single project page, not a separate step
- [x] Reference principles and deliberate differences — Phase 2-tail UI slice (ADR-034) added a
  "Reference & deliberate differences" section to the project page: reference toggle, surface
  traits, functional principles, similarity guardrails, and add/remove deliberate-difference rows
  with a live count against `MINIMUM_DELIBERATE_DIFFERENCES`. Live-verified: saving with only 2
  differences surfaces the schema's own refinement error in the UI for the first time; a 3rd
  difference makes the save succeed.
- [x] Basic music identity — genres/tempo/instrumentation fields on the project page
- [x] Basic structure and emotion curve — Phase 2-tail UI slice (ADR-034) added a "Structure &
  emotion curve" section: add/remove/reorder (Move up/down) `structure` rows and add/remove
  `emotionCurve` rows. `order` is derived from list position at save time rather than a manual
  field. Live-verified: data round-trips through Postgres on reload, and re-running Analyze against
  real (non-empty) structure data runs cleanly (previously only ever exercised against `structure: []`).
- [x] Basic lyric mode — mode select + lyrics text + locked lines on the project page
- [x] Provider selection — generic/suno/udio checkboxes
- [x] Prompt results — Safe/Balanced/Bold shown after Compile, persisted to `PromptPackage` rows
- [x] Copy — per-strategy copy-to-clipboard button
- [x] TXT/JSON export — `GET /api/projects/{id}/export/txt|json`

### Definition of done

- [x] A user completes the full Mock flow. — live-verified: signup → create project → edit North
  Star/lyrics/locked lines → autosave (PATCH) → compile/compare (generic provider) →
  Safe/Balanced/Bold returned with locked lyric line preserved → TXT/JSON export, all against a
  real Postgres (`docker compose up -d && pnpm prisma migrate dev --name init`).
- [x] Reloading preserves the project. — verified: PATCH bumped the version, a subsequent GET
  returned the updated title/spec from the database.
- [x] Another user cannot access it. — verified with two real signed-up accounts: user 2's GET on
  user 1's project returned 403; also covered by a unit test with a mocked session/repository
  (`tests/unit/apiProjectRoute.test.ts`).
- [x] Playwright covers the happy path. — `tests/e2e/happy-path.spec.ts` runs and passes
  (`pnpm test:e2e`) against the live dev server + database. Fixed two real issues it caught: a
  locator ambiguity and a missing clipboard-permission grant/error handling — see
  `docs/TROUBLESHOOTING.md`.

---

## Phase 3 — Gemini structured compiler

Status: `DONE` (first-slice scope, live-verified with real Gemini calls)

### 3.1 Official SDK verification

- [x] Verify the current official Google GenAI JavaScript SDK. — `@google/genai` (unified SDK).
- [x] Verify the current stable or recommended API. — Interactions API (`client.interactions.create`).
- [x] Verify structured output syntax. — `response_format: { type, mime_type, schema }` + `z.toJSONSchema`.
- [x] Verify supported model identifiers. — checked against the installed package's own `Model_2` type union.
- [x] Record the result in `DECISIONS.md`. — ADR-028.

Verified against ai.google.dev, npmjs.com, github.com/googleapis/js-genai, and the installed
package's own `.d.ts` files directly — not old examples.

### 3.2 Environment

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_API_MODE
```

- [x] `GEMINI_MODEL` is configurable (unchanged from ADR-018; `.env.example` now documents
  `gemini-3.5-flash` as the current recommended default per ADR-028).

### 3.3 Adapter

- [x] `class GeminiLLMProvider implements LLMProvider` (`src/llm/gemini/geminiLLMProvider.ts`) —
  real `@google/genai` Interactions API call.
- [x] `class GeminiPromptCompiler implements PromptCompiler` (`src/llm/gemini/geminiPromptCompiler.ts`)
- [x] `class GeminiPromptEvaluator implements PromptEvaluator` (`src/llm/gemini/geminiPromptEvaluator.ts`)

Transport details (the SDK, JSON Schema conversion, retry/timeout options) stay inside
`src/llm/gemini/`; domain/compiler code only depends on the `LLMProvider`/`PromptCompiler`/
`PromptEvaluator` interfaces.

### 3.4 Compiler pipeline

`src/compiler/pipeline.ts` (unchanged structure from Phase 1, now backed by real Gemini when
configured):

1. [x] Validate SongDesignSpec. — caller-side, via `SongDesignSpecSchema`.
2. [x] Apply deterministic theory summaries. — still a Stage B pass-through stub (Phase 4 territory).
3. [x] Project to provider compiler input.
4. [x] Call Gemini structured output.
5. [x] Parse with Zod. — inside `GeminiLLMProvider.generateStructured`.
6. [x] Run deterministic validation. — Stage E, unchanged.
7. [x] Call separate evaluator. — Stage F, unchanged (ADR-009).
8. [x] Repair once only if blocking. — Stage G, unchanged (ADR-010).
9. [x] Persist package and metadata. — new `PromptPackage` columns (§3.6).

### 3.5 Prompt roles

- [x] `provider-compiler.system.md`
- [x] `prompt-evaluator.system.md`
- [x] `prompt-repair.system.md`
- [ ] `spec-enrichment.system.md` — deferred (ADR-030): Stage B doesn't call Gemini yet (Phase 4).

Not one giant system prompt — each is its own file under `src/llm/gemini/prompts/`, read via
`readSystemInstructionTemplate()`.

### 3.6 Required metadata

Persisted on `PromptPackage` (new columns, migration `20260714063919_add_compile_metadata`):

- [x] Provider profile version — already existed (`providerProfileVersion`).
- [x] Gemini model
- [x] API mode
- [x] Prompt-template version
- [x] Schema version
- [x] Latency
- [ ] Success/failure — only successful compiles get a row this slice (documented simplification;
  logging failed attempts needs the still-pending logging/observability provider decision).
- [x] Repair count

- [x] Gemini key is never persisted — confirmed by reading the migration and the API routes; only
  `model`/`apiMode`/etc. (never `GEMINI_API_KEY`) are written.

### 3.7 Resilience

- [x] Timeout — `GEMINI_REQUEST_OPTIONS.timeout` (60s, tuned from a live-verified ~17-19s baseline
  for simple calls once the actual large `MusicAIPromptPackageSchema` + concurrent Safe/Balanced/
  Bold calls pushed real latency past the initial 30s guess).
- [x] Retry only for transient failures — delegated to the SDK's own `maxRetries: 1` (its own
  retry policy, not reimplemented) plus `mapGeminiError` distinguishing 4xx from 5xx.
- [x] No retry storm — capped at the SDK's `maxRetries: 1`.
- [x] Rate-limit response — 429 mapped to a distinct, clear message (`mapGeminiError`), not retried
  into.
- [ ] Budget limit — deferred; needs a product policy decision (new pending item in `DECISIONS.md`).
- [x] User-friendly error — `mapGeminiError` covers 429/401/403/5xx/other.
- [x] Mock fallback in development only — `src/llm/devFallback.ts`; production rethrows.

### Definition of done

- [x] Real Gemini call compiles one fixture. — live-verified repeatedly against the real rotated
  key: Safe and Balanced strategies returned genuinely distinct, on-topic creative lyrics/style
  text from `gemini-3.5-flash`, with the locked lyric line preserved verbatim. See
  `docs/PHASE_LOG.md` Phase 3 entry for the actual content and timings.
- [x] Structured output validates. — every successful call parsed through
  `MusicAIPromptPackageSchema`/`PromptQualityReportSchema` with no manual coercion.
- [x] Invalid fixtures are blocked before the API call where possible. — `SongDesignSpecSchema`
  validation happens before any Gemini call is made.
- [x] Repair count never exceeds one. — unchanged Stage G cap (ADR-010); `repairCount` persisted
  as 0 or 1.
- [x] API key is absent from browser bundles and logs. — `server-only` guards throughout
  `src/llm/gemini/`; `mapGeminiError`/console.warn messages never include the key.
- [x] Mock tests still run in CI without the key. — all 52 unit tests mock `@google/genai` or use
  `MockPromptCompiler`/`MockPromptEvaluator` directly; none require network access.

---

## Phase 4 — Theory engines

Status: `DONE` (first-slice scope, live-verified)

1. [x] `FormFunctionEngine` (`src/theory/formFunctionEngine.ts`)
2. [x] `ProsodyEngine` (`src/theory/prosodyEngine.ts`)
3. [x] `ArrangementFormEngine` (`src/theory/arrangementFormEngine.ts`)
4. [x] `MelodyMemoryEngine` (`src/theory/melodyMemoryEngine.ts`)
5. [x] `RhythmMomentumEngine` (`src/theory/rhythmMomentumEngine.ts`)
6. [x] `HarmonyGravityEngine` (`src/theory/harmonyGravityEngine.ts`)
7. [x] `SubtractionEngine` (`src/theory/subtractionEngine.ts`)

All 7 are pure, deterministic functions over `SongDesignSpec`'s already-declared text/metadata
(section names, energy levels, trait lists, plan arrays) — explainable warnings and suggestions,
not audio/MIDI analysis, per this phase's own instruction. See `docs/PRODUCT_SPEC.md` §6.2 →
engine mapping and field ownership recorded in `docs/PHASE_LOG.md`'s Phase 4 entry.

`runTheoryEngines()` (`src/theory/runTheoryEngines.ts`) combines all 7 and is wired into
`compiler/pipeline.ts` Stage B, replacing the pass-through stub from Phase 1.

### Definition of done

- [x] Each engine has deterministic fixtures. — one test file per engine
  (`tests/unit/theory/*.test.ts`), built on `buildValidSpec()` with targeted overrides.
- [x] Each suggestion includes a reason. — every `TheoryWarning` has a `message`, most also have a
  `suggestion`; all severities are `"info"`/`"warning"` (never `"blocking"` — these are creative
  advisories, not compile-time validation, which stays Stage E's job).
- [x] Users can reject or lock suggestions. — reject: `compositionTheory.dismissedWarnings` (ADR-031);
  lock: existing `SongDesignSpec.lockedFields` mechanism (ADR-031). Both live-verified via
  `POST /api/projects/{id}/analyze` + the existing `PATCH` (dismissed a real warning, confirmed it
  stayed filtered on re-analyze; locked `formNotes`, confirmed re-analyze didn't overwrite it).
- [x] Gemini receives only selected or confirmed results. — Stage B's `theorySummary` is
  `runTheoryEngines(spec)`, which already excludes dismissed warnings before `ProviderCompilerInput`
  is built.

---

## Phase 5 — Advanced lyrics

Status: `DONE` (first-slice scope, live-verified)

### Features

- [x] Draft A/B/C — `LyricsDraftGenerator` (`src/lyrics/`), Mock + Gemini, produces 3 genuinely
  different drafts per `POST /api/projects/{id}/lyrics/draft` (ADR-033).
- [x] Direct/simple mode — `LyricsDesignSpec.mode` (Phase 1 schema); the generator/validator now
  enforce it produces zero techniques, live-verified against real Gemini output.
- [x] User know-how selection — `knowHowIntensity`/`selectedTechniques`/`excludedTechniques`
  (Phase 1 schema); the generator reads them, the validator enforces them.
- [x] Locked lines — `lockedLines` (Phase 1 schema); the validator requires every draft to include
  them verbatim.
- [x] Diff — `src/lib/diffLines.ts` (LCS-based, no new dependency), shown in `ProjectEditor.tsx`
  before applying a chosen draft.
- [ ] Theme / Ideation / Melody fit / Revision *screens* — `workflowStage` (Phase 1 schema) exists
  and advances to `"draft"` when a draft is applied, but there's no dedicated screen per stage yet
  — deferred to the Phase 2-tail UI pass (same category of gap as Phase 2's deferred reference/
  deliberate-differences editing).
- [ ] Korean, Japanese, and English prosody profile selection / Singer-character profile / Story
  viewpoint — `culturalProfile`/`pointOfView`/`speaker`/`addressee` (Phase 1 schema) exist and the
  Gemini template reads them when set, but there's no UI form control for them yet — same deferred
  category.

### Definition of done

- [x] Direct mode does not inject metaphor by default. — live-verified: a real Gemini call with
  `mode: "direct"` returned 3 drafts, all with `techniquesUsed: []`, while still producing genuinely
  different, on-theme creative lyrics for each.
- [x] Selected techniques are traceable. — `validateLyricsDraftSet()` requires every reported
  technique to be a verbatim member of `selectedTechniques`; live testing caught real Gemini output
  reporting an unselected technique name, which is now rejected with a clear error (see
  `docs/TROUBLESHOOTING.md`).
- [x] Excluded techniques do not appear. — validated the same way; unit-tested.
- [x] Locked lines survive compile and revision. — the existing Stage E check
  (`compiler/pipeline.ts`) already covered compile; `validateLyricsDraftSet()` extends the same
  guarantee to the drafting step, live-verified against real Gemini output for a 2-line-locked spec.

---

## Phase 6 — Revision Lab

Status: `TODO`

### Features

- Generation review
- Issue classification
- Local/section/global scope
- One-to-three control recommendation
- Lock unaffected fields
- Before/after diff
- Rollback

### Definition of done

- A weak-chorus review modifies hook controls only.
- Unrelated genre, theme, and locked lyrics stay unchanged.
- Version history is recoverable.

---

## Phase 7 — Visual system and landing page

Status: `IN PROGRESS` (first slice done, live-verified — see below)

### Features

- [x] Dark immersive hero — `src/app/Hero.tsx`/`Hero.module.css`, full-viewport section, dark
  gradient background, centered headline + description, plus a responsive animated background
  (`src/app/HeroBackground.tsx`): two verified public-domain Beethoven portraits cross-fading with
  a slow Ken Burns zoom/pan every ~8s, behind a dark scrim so text stays readable (see ADR-036 for
  image sourcing).
- [ ] Original Sound Seed Orb — not built yet; the hero background is real photographic art
  (Beethoven portraits) rather than the originally-planned original generative orb visual.
- [x] Live transformation demo — `src/app/DemoForm.tsx` + `src/app/api/demo/compile/route.ts`: a
  no-login textarea → Generate → real (Mock-only, by construction — see ADR-036) compiled result.
  Now embedded directly in `Hero.tsx` (ADR-038), visible immediately on landing without scrolling —
  the dedicated `CTA.tsx` section that previously wrapped it was removed as redundant.
- [x] Methodology story — `src/app/Craft.tsx` ("Built on real songwriting craft"): 3 cards on real
  `docs/METHODOLOGY.md`/`CLAUDE.md` principles (reference-is-function + the 3-difference gate,
  direct/simple lyrics as a complete option, locked lines survive every revision) — deliberately
  replaces a fabricated-testimonial section with something true; see ADR-037.
- [ ] Provider selector
- [ ] Composition/Lyrics Lab preview
- [ ] App section
- [x] Final CTA — folded into Hero (ADR-038): the demo *is* the primary call to action now, so it
  lives above the fold rather than at the bottom of the page. The page is a 4-section composition
  (Hero(+demo)/Problem/Service/Craft — `src/app/page.tsx`). Sign up/Log in are small text links
  below the demo form; the fading scroll-hint chevron (`src/app/ScrollHint.tsx`) sits at the bottom
  of the hero's normal content flow (no longer a page-wide `fixed`/`absolute` bar — see
  ADR-037/ADR-038 and Troubleshooting for the layout history).

### Guardrails

- [x] No copied NYPC assets — no video/image/font/copy of theirs was reused; see ADR-035.
- [x] ~~No copied exact layout~~ — **overridden for this slice only**, by explicit user
  instruction, after being shown this guardrail. Layout/measurements were closely modeled on
  nypc.co.kr's teaser page; brand assets/copy/licensed font were not. See ADR-035. This override
  does not apply to the remaining Phase 7 items (Orb, live demo, methodology story, etc.), which
  are still free to diverge from NYPC as originally planned.
- [x] Reduced motion — the scroll-hint bounce, hero Ken-Burns/cross-fade, and the per-section
  scroll-reveal fade-in (`src/app/Reveal.tsx`) all inherit the existing global
  `prefers-reduced-motion` rule in `globals.css`; the cross-fade `setInterval` and `Reveal`'s
  `IntersectionObserver` are additionally skipped entirely in JS when reduced motion is on (not
  just sped up to ~0). Live-verified via Playwright (`tests/e2e/landing.spec.ts`).
- [x] Mobile fallback — responsive breakpoints at 1261/1024/640px; live-verified via screenshot at
  375px width with no horizontal overflow.
- [ ] Performance budget — not measured yet (no Lighthouse run this slice).

### Definition of done

- [x] Responsive screenshots reviewed. — desktop hero, desktop scroll-reveal section, and 375px
  mobile width all screenshotted and reviewed during live verification (caught and fixed a real
  layout bug — see Troubleshooting).
- [ ] Keyboard navigation works. — not explicitly checked yet (Sign up/Log in are plain `<Link>`s,
  so likely fine, but not verified this slice).
- [ ] Lighthouse or equivalent baseline recorded. — not done yet.
- [x] Heavy visual effects are lazy-loaded. — N/A for this slice; no heavy effects exist yet (Orb,
  live demo).

---

## Phase 8 — PWA

Status: `DEFERRED`

- Manifest
- Service worker
- Offline shell
- Offline project draft
- Sync queue
- Update UI
- Network-state UI

---

## Phase 9 — Capacitor iOS and Android

Status: `DEFERRED`

- Verify current Capacitor stable version
- Native projects
- Secure storage
- Share sheet
- File export
- Deep links
- Network status
- Store readiness

---

## Phase 10 — Provider expansion

Status: `DEFERRED`

Potential profiles:

- Stable Audio
- Google Lyria
- Eleven Music
- MusicGen
- AIVA

Each requires official capability verification and tests.

---

## Cross-phase test matrix

### Security

- Secret absent from client
- Project authorization
- File validation
- Log redaction
- Rate limiting

### AI

- Schema validation
- Prompt-template versioning
- Structured-output failure
- Timeout
- Rate limit
- Repair pass limit
- Locked-field preservation

### Product

- Autosave
- Version conflict
- Provider switching
- Unsupported intent preservation
- Export
- Revision rollback

---

## Immediate next task

1. ~~Complete Phase 0.~~ Done for first-slice scope; CI is still the one open item (see Phase 0 checklist).
2. ~~Complete the schemas and Mock compiler from Phase 1.~~ Done — 18 unit tests, typecheck/lint/build all pass.
3. ~~Complete Phase 2 first slice and live-verify it.~~ Done — 25 unit tests + a live walkthrough
   against a real Docker Postgres (signup, CRUD, autosave, compile, export, cross-user ownership
   denial) + a passing Playwright run. See `docs/PHASE_LOG.md` and `docs/TROUBLESHOOTING.md`.
4. ~~Complete Phase 3 (Gemini) and live-verify it.~~ Done — SDK verified against official sources
   and the installed package's own types (ADR-028), real `@google/genai` Interactions API wiring,
   52 unit tests (all offline/mocked), and repeated live calls against the real rotated key
   producing genuinely distinct Safe/Balanced/Bold creative output with locked lyrics preserved.
   See `docs/PHASE_LOG.md` and `docs/TROUBLESHOOTING.md` for exact timings and a real correctness
   bug (dev-fallback metadata mislabeling) caught and fixed during live testing.
5. ~~Complete Phase 4 (theory engines) and live-verify it.~~ Done — all 7 engines
   (`src/theory/`) wired into Stage B, reject via `dismissedWarnings` and lock via the existing
   `lockedFields` mechanism (ADR-031/032), 99 unit tests (up from 52), and a live walkthrough:
   analyzed a real project (6 real warnings), dismissed one and confirmed it stayed filtered,
   locked a notes field and confirmed re-analyze didn't overwrite it, then confirmed compile still
   works end-to-end with the real theory summary feeding Stage D.
6. ~~Complete Phase 5 (advanced lyrics) and live-verify it.~~ Done — `LyricsDraftGenerator`
   (Mock + Gemini), `validateLyricsDraftSet()`, `diffLines()`, and the draft/diff/apply UI; 120
   unit tests (up from 99); live-verified direct mode (zero techniques), locked-line preservation,
   and a real technique-traceability bug found and fixed. See `docs/PHASE_LOG.md`/`TROUBLESHOOTING.md`.
7. ~~Complete the Phase 2-tail UI first slice (reference/deliberate-differences,
   structure/emotion-curve) and live-verify it.~~ Done — ADR-034, still one dense project page
   (not the full 8/14-screen wizard). Live-verified: the schema's own `.check()` refinement
   (>=3 differences once a reference is set) is reachable from the UI for the first time and
   surfaces correctly; structure/emotion-curve rows round-trip through Postgres; re-running Analyze
   against real structure data runs cleanly. Caught and fixed a real bug: the save-error banner
   only ever showed the generic `"Invalid song design spec."` message, silently dropping the
   specific Zod issue text the API already returned — see `docs/TROUBLESHOOTING.md`.
8. ~~Complete the Phase 7 first slice (dark immersive hero + scroll-reveal section + final CTA,
   structurally modeled on nypc.co.kr per explicit user instruction) and live-verify it.~~ Done —
   ADR-035. `src/app/page.tsx`/`page.module.css`/`ScrollHint.tsx`; live-verified via screenshots
   (caught and fixed a real layout bug: the fixed CTA bar overlapped the last description item),
   mobile-width overflow check, reduced-motion check, and a new `tests/e2e/landing.spec.ts`.
9. ~~Add responsive animated hero background art and a no-login "try it now" demo.~~ Done —
   ADR-036. `src/app/HeroBackground.tsx` (two verified public-domain Beethoven portraits,
   cross-fade + Ken Burns, reduced-motion aware) and `src/app/api/demo/compile/route.ts` +
   `src/app/DemoForm.tsx` (Mock-only by construction — never imports `compilePipelineDeps`, no
   auth, no persistence). 123 unit tests (up from 120); live-verified via screenshots (desktop,
   scroll-reveal with demo result, 375px mobile) and a new `tests/e2e/landing.spec.ts` case
   proving the demo works with zero session cookies. Caught and fixed a real gap: the demo's
   `fields.lyrics` came back empty because `MockPromptCompiler` derives it only from
   `lyricsDesign.originalLyrics`, not `northStar` — see `docs/TROUBLESHOOTING.md`.
10. ~~Restructure the landing page into 5 sections (Hero/Problem/Service/Craft/CTA) with
    grounded copy.~~ Done — ADR-037. New `Problem.tsx`, `Craft.tsx` (replaces a fabricated-
    testimonial slot with real methodology principles), `Reveal.tsx` (shared scroll-reveal,
    reduced-motion aware); `Service.tsx` restructures the old feature list into outcome-framed
    cards; `Hero.tsx`/`CTA.tsx` extracted from the old monolithic `page.tsx`. Two new "artistic"
    accent tokens (`--color-accent-crimson`/`--color-accent-gold`) extend the palette; CSS Modules
    kept over Tailwind (no concrete benefit for one page, see ADR-037). Caught and fixed a real
    layout bug live: Hero's `position: fixed` CTA bar (fine with 2 sections) started overlapping
    every section below it once there were 5 — changed to `position: absolute` scoped to the hero.
    All 123 unit tests still pass unchanged; `tests/e2e/landing.spec.ts` extended to assert all 5
    section headings render.
11. ~~Move the no-login demo above the fold, into Hero.~~ Done — ADR-038. `DemoForm` now renders
    inside `Hero.tsx` directly; the dedicated `CTA.tsx` section was deleted. `Hero.module.css`
    changed from absolute/fixed bottom-anchored positioning to normal-flow flexbox centering.
    Live-verified at 1280×720/1440×900/375×812 that headline + description + demo form + auth
    links + scroll hint all fit within one viewport at every size tested. `tests/e2e/landing.spec.ts`
    updated (removed the now-gone "Try it right now" heading case, added a dedicated
    above-the-fold-visibility case, fixed an ambiguous `getByText(/Sign up/).last()` assertion).
12. ~~Restyle login/signup to match the landing page; add compile history.~~ Done — ADR-039.
    New `src/app/AuthForm.module.css` (shared by `/login`/`/signup`, reuses `HeroBackground` +
    the crimson/gold gradient button); `GET /api/projects/{id}/history` (ownership-checked,
    returns up to 50 past `PromptPackage` rows newest-first) + a "View history" section in
    `ProjectEditor.tsx`. Chose compile history over project-version history after presenting both
    real options to the user (this app has no chat/conversation data model, so a literal
    "conversation history" doesn't apply — both alternatives were already-persisted, previously
    unsurfaced data). 127 unit tests (up from 123); live-verified end-to-end via a temporary
    Mock-forced dev-server pass (real Gemini hit the known Phase 7 third-slice latency flake,
    unrelated to this feature).
13. ~~Give the explanatory sections (Problem/Service/Craft) a livelier, "music-prompt-site" visual
    treatment.~~ Done — ADR-040. Staggered per-card `Reveal` pop-in with a back-out/bounce easing,
    per-card accent-color cycling (existing tokens, no new colors), and a new 4th Craft card
    honestly grounding the theory engines/lyric techniques in the real sources
    `docs/METHODOLOGY.md` already cites (Berklee/USC Thornton/NYU Steinhardt/Juilliard curricula,
    Kim Eana/K-pop lyric-team practice) — not an unverified marketing claim.
15. ~~Add an English/Korean/Japanese language switcher.~~ Done — ADR-041. Top-right, fixed,
    order E/한/日 exactly as specified. Cookie-persisted client state (`src/app/LocaleProvider.tsx`),
    not URL-based locale routing (no `next-intl`, no `/ko`/`/ja` paths) — see ADR-041 for the
    trade-off, including the real, disclosed cost of `/`/`/login`/`/signup` losing static rendering
    (confirmed via `pnpm build` output) since `layout.tsx` now reads the locale cookie server-side.
    Translates the landing page + auth pages only; `Dictionary` interface
    (`src/i18n/dictionaries/types.ts`) makes a missing translation key a compile error. 129 unit
    tests (up from 127, new dictionary key-parity test); live-verified all 3 languages at desktop
    and mobile widths via screenshots, plus persistence across a reload.
16. ~~Fix no-login demo output quality (genre/tempo/vocal extraction) + remove named-person
    reference from Craft copy.~~ Done — ADR-042/ADR-043. A user reported the demo always producing
    "unspecified genre at unspecified ... unspecified instrumentation" and a lyrics field that just
    echoed their input verbatim, and asked whether this was because Gemini needs login — it was not;
    two real bugs in `src/app/api/demo/compile/route.ts` (never populating
    `musicalIdentity.genres`/`tempoDescription`/`instrumentation` from the free-text idea, and
    conflating the idea description with actual lyric text). Fixed with a new, deterministic,
    non-AI keyword extractor (`extractHints.ts`, EN/KO/JA) and an honest "sign up for real lyrics"
    fallback message. Also removed the Kim Eana/김이나/キム・イナ named-person reference from Craft
    card 4 across all three locales per explicit user request, replacing it with generic
    professional-practice phrasing. 137 unit tests (up from 129); live-verified against the running
    dev server with the user's exact reported input, which also caught and fixed a substring-
    collision bug (`"kpop"` double-matching the generic `"pop"` keyword).
17. ~~Add AI-assisted spec interpretation: free-text North Star → structured `musicalIdentity`/
    `lyricsDesign.mode` suggestions.~~ Done — ADR-044. The user's core objection: the product's
    reason to exist is that a vague/messy idea should still produce a well-formed structured
    result via the theory engines + Gemini — investigation confirmed this did not exist yet in the
    real (authenticated) flow; `ProjectEditor.tsx` required every field typed manually, and Gemini
    only ever compiled an already-complete spec, never inferred one. Added `SpecInterpreter`
    (`src/spec-interpreter/`), mirroring `LyricsDraftGenerator`'s exact Mock/Gemini pattern:
    `POST /api/projects/{id}/spec/interpret` (not persisted, same suggest-then-PATCH pattern as
    lyrics drafts/theory warnings), a new "Suggest style from North Star (AI)" button + suggestions
    panel (confidence + rationale per field, Apply/Discard) in `ProjectEditor.tsx`, and a
    deterministic `validateInterpretation()` backstop (never overrides an already-set field, drops
    any suggestion missing a `fieldProvenance` entry). Scope this slice: `musicalIdentity` +
    `lyricsDesign.mode` only (structure/emotionCurve/contrastPlan/hookPlan/compositionTheory
    inference is a known, larger follow-up). 149 unit tests (up from 137); live-verified twice
    against the running dev server — Mock-forced (honestly returns no suggestions for genuinely
    vague input) and real Gemini (a vague Korean North Star produced specific, well-reasoned
    Ballad/slow-tempo/acoustic-instrumentation/sorrowful-vocal suggestions with per-field
    confidence) — the concrete proof of "개떡같이 입력해도 찰떡같이 나온다."
18. ~~Make composition-theory engine warnings genuinely load-bearing in compiled output.~~ Done —
    ADR-045. User asked directly whether prompt generation is really theory-based; investigation
    found the 7 composition-theory engines' warnings reached Gemini's payload but were never
    required to be used, never validated, and the Mock compiler hardcoded them empty. Added
    `theoryAddressal: TheoryAddressal[]` to `MusicAIPromptPackageSchema` (`SCHEMA_VERSION` "1"→"2"),
    a self-reported/deterministically-checked link between a warning and how it was addressed,
    mirroring the existing lyrics-technique traceability pattern exactly. `provider-compiler.
    system.md` now requires one traceable entry per active warning; `validateTheoryAddressal.ts`
    (new) makes an unaddressed one a genuine Stage E blocking failure (triggers the existing
    repair pass); `mockOutputBuilders.ts` and `ProjectEditor.tsx`'s results section updated to
    match. Live-testing against real Gemini found the initial "address every warning regardless of
    severity" requirement made compiles measurably slower (single-strategy ~45-62s vs. the
    historical ~17-25s, 3-way concurrent Safe/Balanced/Bold calls sometimes exceeding even a raised
    90s timeout and falling back to Mock in dev) — presented the numbers to the user, who chose to
    restrict the mandatory requirement to warning/blocking severity only (info stays optional).
    156 unit tests (up from 149); live-verified via a single-strategy compile call (avoiding 3-way
    concurrency noise) that a spec with nothing substantive produces an honest empty
    `theoryAddressal`, and a spec with a real issue (4 genres, tripping SubtractionEngine) produces
    a traceable entry whose resolution is genuinely reflected in the compiled `style` field.
19. ~~Let the anonymous demo use real Gemini + composition theory, gated by rate limiting.~~ Done —
    ADR-046 (supersedes ADR-036's Mock-only structural guarantee). User tested the demo with a real
    query and got Mock's generic placeholder output; confirmed the demo never called Gemini or ran
    the theory engines by design, pending rate limiting. User set explicit numbers: unlimited
    during MVP/dev, 5 requests/IP/hour once deployed to Vercel, unlimited for signed-in users (no
    extra code needed — they use the separate authenticated compile endpoints already). Added
    `src/lib/rateLimit.ts` (generic in-memory fixed-window limiter) + `src/lib/demoRateLimit.ts`
    (demo-specific instance, IP-keyed); `src/app/api/demo/compile/route.ts` now uses the shared
    `compilePipelineDeps` (same Gemini-when-configured resolution as authenticated compiles)
    instead of hand-built Mock-only deps, so the 7 theory engines and ADR-045's `theoryAddressal`
    enforcement now apply automatically. 162 unit tests (up from 156); live-verified with the
    user's exact reported idea — real Gemini produced rich, specific output (concrete
    instrumentation, real Korean dialogue-format lyrics, fitting title) in 37s, and confirmed
    multiple consecutive requests succeed unrestricted in dev. **Disclosed limitation**: the
    in-memory rate-limit store only works correctly within a single process — a shared store
    (Vercel KV/Upstash) is needed before the "5/hour" limit can be a hard guarantee across Vercel's
    serverless instances; tracked as a real pre-deployment follow-up, not solved yet.
20. ~~Demo UX: instant local preview + async upgrade to the real Gemini result.~~ Done — ADR-047.
    User asked for sub-3-second demo response; confirmed not achievable with real Gemini + theory
    (already fastest model tier, 2 sequential real calls per request, ~15-40s+ observed floor).
    `DemoForm.tsx` now calls the same `extractHints()` the server uses, client-side, the instant
    Generate is clicked — a "Quick preview" badge + guess appears well under 1s, with an
    "upgrading" notice while the real call is in flight, replaced by the real result once it
    resolves. Pure client-side UX change, no backend/schema change. New dictionary keys
    (`previewBadge`/`upgradingNotice`, en/ko/ja). Live-verified with the user's exact idea:
    screenshotted both the instant-preview and final-result states.
21. ~~Bouncing "refining" animation + ground the compiler directly in the composition-theory
    document.~~ Done — ADR-048. Verified both knowledge files first: lyrics knowhow was already
    fully cited in `lyrics-draft.system.md`; the composition-theory document (~880 lines, real
    Berklee/USC Thornton/NYU Steinhardt/Juilliard + academic sources) was the actual gap — the main
    `provider-compiler.system.md` only ever saw the 7 engines' structural warnings, never the
    document's actual written principles. Added a new cited section embedding curated excerpts (7
    core principles, genre-specific topline guidance, AI-prompting-specific advice) — not the full
    file. Also added a bouncing 3-note emoji animation (`noteBounce` keyframe) to the demo's
    upgrading notice. Live-verified: the same idea's `theoryAddressal` resolutions became
    noticeably more theory-literate (e.g. citing silence-before-final-chorus, minor-to-major
    harmonic movement) versus the pre-change output; confirmed the animation genuinely animates via
    computed-style diffing. Disclosed cost: latency rose from ~37s to ~70s for the same call
    (already-accepted trade-off per ADR-047's instant-preview UX). No schema/test changes.
22. ~~Fix demo latency/reliability regression from ADR-048.~~ Done — ADR-049. User reported the
    demo showing Mock's generic output again and demanded 3x+ real speed; server logs confirmed a
    genuine `Request timed out` fallback, compounded by `maxRetries: 1` into 3-6 minute worst-case
    waits (compile timeout+retry, then evaluate timeout+retry). Fixed three things: demo now always
    uses `MockPromptEvaluator` (its `promptQuality` output is never shown in `DemoForm.tsx`, so the
    real evaluator call was pure wasted latency and a second failure point); `maxRetries` lowered
    1→0 (a retry of an identical timed-out request rarely helps, and doubling the wait is worse
    than failing once); the ADR-048 theory-grounding prompt trimmed ~40% shorter. Live-verified
    honestly: a fresh realistic idea compiled via real Gemini in 26.5s (vs. ~70s baseline) with
    genuinely good output, confirming the fix helps the typical case — but the user's own original
    bilingual/dual-vocal test sentence still occasionally hit the 90s timeout even after all three
    fixes (confirmed not a session-wide slowdown by testing a different idea immediately after,
    which succeeded quickly). Worst-case wait capped at 90s instead of 180-360s; a guaranteed speed
    floor for every possible input isn't something a prompt-side fix can promise, and this was
    stated plainly rather than oversold.
23. ~~Stop asking the compiler LLM to generate deterministic/discarded output fields.~~ Done —
    ADR-050. User rejected further prompt/retry tuning, asking for a genuine speed+quality fix, not
    a trade-off. Audited `MusicAIPromptPackageSchema` and found `providerId`/`providerDisplayName`/
    `providerProfileVersion`/`profileVerifiedAt`/`strategy`/`theoryRationale`/`warnings`/
    `toolInstructions`/`copyBundle`/`promptQuality` were all either already known server-side,
    mechanically derivable from spec, or (for `promptQuality`) unconditionally discarded by the
    Stage F evaluator every call. New `CompilerOutputSchema` narrows what Mock/Gemini must produce
    to the five genuinely creative fields; new `src/compiler/deterministicFields.ts` assembles the
    rest. `SCHEMA_VERSION` unchanged (internal restructuring, not a persisted-shape change). All 169
    unit tests pass.
24. ~~Fix a real Gemini API hang triggered by unbounded array fields.~~ Partial — ADR-051. Live-
    verifying item 23 kept hitting the same ~90s timeout pattern, including on a previously-fast
    sentence. Diagnosed directly instead of assuming external slowdown: ruled out API-key/config
    loading (a raw minimal call succeeded in 10s); reproduced a 180s+ hang by calling the SDK
    directly with the real system instruction + real schema, bypassing the app entirely; isolated
    that neither component alone was slow (18.6s and 10.2s respectively) but the combination hung;
    found that adding `.max()` bounds to previously-unbounded array fields (`theoryAddressal`,
    `unsupportedIntents`, `revisionLevers`, `guidanceTags`, `suggestedProviderIds`) let a reduced
    version of the same request succeed in 16.5s. Applied the bounds to the real schema. **Honest
    result**: a live retest through the actual demo endpoint after this fix still hit the 90s
    timeout — the fix is not confirmed to fully resolve the hang. Kept anyway as a reasonable
    schema-hygiene improvement; further live diagnosis paused (time/cost) per user decision.
25. ~~Target genre-topline theory guidance to the declared genre(s) instead of listing all six.~~
    Done — ADR-052. User rejected dumping the full 38KB theory document into the system
    instruction (correctly noting it would likely worsen the ADR-051 latency problem, not fix it),
    proposing instead that only the genre(s) actually present in `musicalIdentity.genres` get their
    matching guidance from theory-doc §8. New `src/llm/gemini/theoryExcerpts.ts` does this with a
    safe fallback to the full list for unrecognized/absent genres; 4 new unit tests, 173 total pass.
    Live-verifying this surfaced a materially different signal than prior attempts: an explicit
    Gemini-side `500 ... currently experiencing high demand` error, not a silent timeout — meaning
    at least some of the chased unreliability may be genuine, time-varying Gemini capacity
    pressure rather than something client-side fixable. The call still fell back to Mock, so this
    change's live quality effect remains unverified; further live retries paused per user decision.
26. ~~Clean up `fields.title` and encourage `fields.structureNotes` in the compiler prompt.~~
    Done — ADR-053. First clean (non-Mock) real Gemini response obtained since ADR-052 showed real
    theory application in `fields.prompt` but a cluttered `title` field (meta-commentary in
    parentheses) and an omitted `structureNotes` field. Added explicit prompt guidance for both;
    typecheck/lint/test (173/173) pass (prompt-only change). Two live retests immediately after
    both hit the 90s timeout/Mock fallback again, so this fix's live effect is not yet confirmed —
    deferred to next session per the standing memory note once Gemini responds more reliably.
27. ~~Retry once against a fallback model on a transient (5xx) Gemini error or a primary-model
    timeout.~~ Done — ADR-054. User explicitly asked to solve the Gemini reliability problem, not
    just document it as external. Added `GEMINI_FALLBACK_MODEL` (defaults to `gemini-2.5-flash`);
    `GeminiLLMProvider` now retries once against it on a transient 5xx or a timeout (timeout retry
    capped at a 30s budget, so worst case is 90s+30s=120s, not a 180s+ compounding wait). Also fixed
    a markdown-code-fence-wrapped response the fallback model was observed producing. 8 new/updated
    unit tests, 180 total pass. Live-verified the mechanism genuinely triggers and sometimes
    succeeds — but also surfaced a new issue: the fallback model doesn't always honor the strict
    schema (one response had a missing required field), and that failure currently happens before
    `pipeline.ts`'s own repair-pass loop gets a chance — left for a future session as a materially
    different, deeper problem than today's timeout/demand work.
28. **Next actual work**: replacing the in-memory demo rate limiter with a shared store (Vercel
    KV/Upstash Redis) before actual Vercel deployment is now a concrete, well-scoped pre-deployment
    task (ADR-046); the larger structure/emotionCurve/contrastPlan/hookPlan inference
    follow-up to item 17 is now a real, well-scoped candidate; translating `/dashboard` and the
    `ProjectEditor` form (the deferred i18n scope from the language-switcher slice) is also a real,
    sizeable candidate; the rest of Phase 7 (Sound Seed Orb,
    provider selector, Lab preview, app section, Lighthouse baseline) remains open; other
    candidates are Phase 6 (Revision Lab), the full 8/14-screen wizard (PRODUCT_SPEC §16),
    `contrastPlan`/`hookPlan`/`repetitionPlan` UI, the lock-field UI for
    `compositionTheory.*Notes` (deferred since Phase 4), or project-version history (the
    alternative not chosen in the compile-history slice — data already exists, UI doesn't). The
    3-way-concurrent Safe/Balanced/Bold real-Gemini latency limitation (ADR-045,
    docs/TROUBLESHOOTING.md) remains unresolved — a candidate follow-up is compiling the three
    strategies sequentially or with staggered starts instead of `Promise.all`, trading total wall
    time for fewer concurrent-timeout fallbacks. A budget-limit policy decision is still pending
    before Gemini usage caps can be implemented, and real rate limiting is still needed before any
    anonymous path could ever be allowed to call Gemini (see `DECISIONS.md`).

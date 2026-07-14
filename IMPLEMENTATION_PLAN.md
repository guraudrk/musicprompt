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

Status: `TODO`

### Features

- Dark immersive hero
- Original Sound Seed Orb
- Live transformation demo
- Methodology story
- Provider selector
- Composition/Lyrics Lab preview
- App section
- Final CTA

### Guardrails

- No copied NYPC assets
- No copied exact layout
- Reduced motion
- Mobile fallback
- Performance budget

### Definition of done

- Responsive screenshots reviewed.
- Keyboard navigation works.
- Lighthouse or equivalent baseline recorded.
- Heavy visual effects are lazy-loaded.

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
8. **Next actual work**: the full 8/14-screen wizard (PRODUCT_SPEC §16) remains out of scope for
   now; other candidates are Phase 6 (Revision Lab), `contrastPlan`/`hookPlan`/`repetitionPlan` UI,
   or the lock-field UI for `compositionTheory.*Notes` (deferred since Phase 4). A budget-limit
   policy decision is still pending before Gemini usage caps can be implemented (see `DECISIONS.md`).

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

Status: `IN PROGRESS` (first-slice scope code-complete; live DB verification pending — see note)

Scope for this slice is trimmed to one dense project page rather than the full 8-screen wizard
(ADR-024). This sandbox has no Docker/Postgres/psql, so items marked "code-complete, not live
tested" below could not be run here — see `docs/PHASE_LOG.md` for exactly what was and wasn't
verified, and what the follow-up commands are.

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
- [ ] Reference principles and deliberate differences — not exposed in the UI form this slice
  (schema/back end already support it; editable only via direct API/JSON for now)
- [x] Basic music identity — genres/tempo/instrumentation fields on the project page
- [ ] Basic structure and emotion curve — not exposed in the UI form this slice (same as above)
- [x] Basic lyric mode — mode select + lyrics text + locked lines on the project page
- [x] Provider selection — generic/suno/udio checkboxes
- [x] Prompt results — Safe/Balanced/Bold shown after Compile, persisted to `PromptPackage` rows
- [x] Copy — per-strategy copy-to-clipboard button
- [x] TXT/JSON export — `GET /api/projects/{id}/export/txt|json`

### Definition of done

- [ ] A user completes the full Mock flow. — code-complete (signup → create → edit → compile →
  copy/export), **not live-executed** in this sandbox (no Postgres). Manual follow-up:
  `docker compose up -d && pnpm prisma migrate dev --name init && pnpm dev`, then walk through it.
- [ ] Reloading preserves the project. — implied by Postgres persistence; not live-verified here.
- [ ] Another user cannot access it. — enforced in code (`requireOwnedProject` returns 403) and
  covered by a unit test with a mocked session/repository (`tests/unit/apiProjectRoute.test.ts`);
  not exercised against a real second account here.
- [ ] Playwright covers the happy path. — `tests/e2e/happy-path.spec.ts` is written but **not run**
  in this session. Manual follow-up: `pnpm exec playwright install && pnpm test:e2e`.

---

## Phase 3 — Gemini structured compiler

Status: `TODO`

### 3.1 Official SDK verification

Before implementation:

- Verify the current official Google GenAI JavaScript SDK.
- Verify the current stable or recommended API.
- Verify structured output syntax.
- Verify supported model identifiers.
- Record the result in `DECISIONS.md`.

Do not rely on old examples.

### 3.2 Environment

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_API_MODE
```

`GEMINI_MODEL` must be configurable.

### 3.3 Adapter

Implement:

```ts
class GeminiLLMProvider implements LLMProvider
class GeminiPromptCompiler implements PromptCompiler
class GeminiPromptEvaluator implements PromptEvaluator
```

Keep transport details out of domain services.

### 3.4 Compiler pipeline

1. Validate SongDesignSpec.
2. Apply deterministic theory summaries.
3. Project to provider compiler input.
4. Call Gemini structured output.
5. Parse with Zod.
6. Run deterministic validation.
7. Call separate evaluator.
8. Repair once only if blocking.
9. Persist package and metadata.

### 3.5 Prompt roles

Create separate prompt templates:

- `spec-enrichment.system.md`
- `provider-compiler.system.md`
- `prompt-evaluator.system.md`
- `prompt-repair.system.md`

Do not use one giant system prompt.

### 3.6 Required metadata

Persist:

- Provider profile version
- Gemini model
- API mode
- Prompt-template version
- Schema version
- Latency
- Success/failure
- Repair count

Do not persist the Gemini key.

### 3.7 Resilience

- Timeout
- Retry only for transient failures
- No retry storm
- Rate-limit response
- Budget limit
- User-friendly error
- Mock fallback in development only

### Definition of done

- Real Gemini call compiles one fixture.
- Structured output validates.
- Invalid fixtures are blocked before the API call where possible.
- Repair count never exceeds one.
- API key is absent from browser bundles and logs.
- Mock tests still run in CI without the key.

---

## Phase 4 — Theory engines

Status: `TODO`

Implement incrementally:

1. `FormFunctionEngine`
2. `ProsodyEngine`
3. `ArrangementFormEngine`
4. `MelodyMemoryEngine`
5. `RhythmMomentumEngine`
6. `HarmonyGravityEngine`
7. `SubtractionEngine`

Start with explainable warnings and suggestions.

Do not pretend to perform exact audio analysis without audio.

### Definition of done

- Each engine has deterministic fixtures.
- Each suggestion includes a reason.
- Users can reject or lock suggestions.
- Gemini receives only selected or confirmed results.

---

## Phase 5 — Advanced lyrics

Status: `TODO`

### Features

- Theme
- Ideation
- Draft A/B/C
- Melody fit
- Revision
- Direct/simple mode
- User know-how selection
- Korean, Japanese, and English prosody profile selection
- Singer/character profile
- Story viewpoint
- Locked lines
- Diff

### Definition of done

- Direct mode does not inject metaphor by default.
- Selected techniques are traceable.
- Excluded techniques do not appear.
- Locked lines survive compile and revision.

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

1. ~~Complete Phase 0.~~ Done for first-slice scope; DB/CI items remain (see Phase 0 checklist).
2. ~~Complete the schemas and Mock compiler from Phase 1.~~ Done — `pnpm typecheck`, `pnpm lint`,
   `pnpm test` (18 tests), and `pnpm build` all pass.
3. **Stop and review this vertical slice before connecting Gemini.** Next actual work is Phase 2
   (auth, Postgres persistence, ORM choice, core web screens) — do not start real Gemini wiring
   (Phase 3) until `GEMINI_API_MODE` and the current official Google GenAI SDK shape are verified
   (ADR-007).

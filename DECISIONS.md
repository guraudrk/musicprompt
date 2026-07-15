# Music Prompt Architect — Architectural Decisions

This file records durable decisions. Add new decisions; do not silently rewrite history.

---

## ADR-001 — Product is a prompt-design platform

- Status: Accepted
- Date: 2026-07-14

### Decision

The MVP creates prompts and song-design packages. It does not automatically generate music through unofficial integrations.

### Reason

This keeps the first product focused, provider-independent, legally safer, and testable.

---

## ADR-002 — Canonical SongDesignSpec

- Status: Accepted
- Date: 2026-07-14

### Decision

All user intent is stored in a provider-neutral `SongDesignSpec`. Provider prompts are derived artifacts.

### Consequence

Changing providers does not destroy the user's design.

---

## ADR-003 — Versioned Provider Registry

- Status: Accepted
- Date: 2026-07-14

### Decision

Provider capabilities, field schemas, limitations, and official-source metadata are versioned data.

### Consequence

Provider changes do not require scattered business-logic edits.

---

## ADR-004 — Gemini is the final structured compiler

- Status: Accepted
- Date: 2026-07-14

### Decision

Gemini receives structured musical decisions and converts them into fluent provider-specific prompt packages.

It does not receive only a raw idea and it does not replace deterministic validation.

### Pipeline

```text
Normalized user data
→ SongDesignSpec
→ theory engines
→ provider projection
→ Gemini structured output
→ deterministic validation
→ independent evaluator
→ optional single repair
```

### Reason

This combines musical control with natural-language quality.

---

## ADR-005 — Gemini key is server-only

- Status: Accepted
- Date: 2026-07-14

### Decision

Use `GEMINI_API_KEY` only in server-side code and deployment secrets.

Never use a `NEXT_PUBLIC_` prefix.

### Consequence

No direct Gemini calls from the browser.

---

## ADR-006 — Exposed keys are revoked, not reused

- Status: Accepted
- Date: 2026-07-14

### Decision

Any key exposed in chat, source control, screenshots, logs, or client code is considered compromised and must be revoked and replaced.

### Reason

Deleting the visible text later does not guarantee the key was not copied.

---

## ADR-007 — Official Google SDK behind an adapter

- Status: Accepted
- Date: 2026-07-14

### Decision

Use the current official Google GenAI SDK and current recommended API after verification.

Keep all SDK-specific code inside an adapter.

### Consequence

The domain layer is not coupled to one endpoint, model, or API revision.

---

## ADR-008 — Structured outputs and Zod

- Status: Accepted
- Date: 2026-07-14

### Decision

Gemini must return schema-constrained JSON. Every response is parsed and validated with Zod.

### Consequence

Free-form text is never trusted as application state.

---

## ADR-009 — Separate compiler, evaluator, and repair prompts

- Status: Accepted
- Date: 2026-07-14

### Decision

Use distinct system instructions and schemas for generation, evaluation, and repair.

### Reason

The generator should not be the sole judge of its own output.

---

## ADR-010 — Single automatic repair pass

- Status: Accepted
- Date: 2026-07-14

### Decision

Automatic repair is limited to one pass and only for blocking schema, capability, conflict, or lock-preservation errors.

### Reason

This limits cost, latency, and uncontrolled rewriting.

---

## ADR-011 — Mock-first development

- Status: Accepted
- Date: 2026-07-14

### Decision

The complete vertical product flow is implemented with deterministic Mock providers before real Gemini calls.

### Consequence

CI and local tests do not require paid API usage.

---

## ADR-012 — Direct lyrics are first-class

- Status: Accepted
- Date: 2026-07-14

### Decision

Direct and simple lyrics are not penalized for lacking metaphor or structural complexity.

### Evaluation

Use emotional accuracy, pronunciation, singability, memorability, character fit, and economy.

---

## ADR-013 — Reference function, not surface copying

- Status: Accepted
- Date: 2026-07-14

### Decision

Reference songs contribute functional principles only. Final prompts remove artist and song names where they would encourage imitation.

---

## ADR-014 — Targeted revisions

- Status: Accepted
- Date: 2026-07-14

### Decision

The default revision scope is local. Change one to three controls and lock unrelated fields.

---

## ADR-015 — Next.js web-first, PWA, then Capacitor

- Status: Accepted
- Date: 2026-07-14

### Decision

Build a responsive Next.js application first, add PWA capability, then add Capacitor-based iOS and Android projects after the core flow is stable.

---

## ADR-016 — NYPC is inspiration, not a template

- Status: Accepted
- Date: 2026-07-14

### Decision

Use high-level qualities such as immersive hero, dark atmosphere, strong typography, and focused CTA.

Do not copy proprietary graphics, wording, exact layout, logo, or brand assets.

---

## ADR-017 — Provider capability freshness

- Status: Accepted
- Date: 2026-07-14

### Decision

Provider profiles record `lastVerifiedAt` and freshness.

Stale or unknown fields are not presented as confirmed facts.

---

## ADR-018 — Model name is configuration

- Status: Accepted
- Date: 2026-07-14

### Decision

The Gemini model identifier lives in `GEMINI_MODEL`.

Do not embed a model name throughout the codebase.

### Reason

Model availability and recommendations change.

---

## ADR-019 — Single Next.js app; monorepo deferred

- Status: Accepted
- Date: 2026-07-14

### Decision

Build one Next.js application with clear internal module boundaries (`src/domain`,
`src/providers`, `src/llm`, `src/compiler`, `src/lib`). Do not introduce a monorepo or workspace
split now.

### Reason

`docs/PRODUCT_SPEC.md` §14.1 anticipates shared domain/UI packages once Capacitor mobile is built,
but that phase is deferred (Phase 9). Splitting into workspaces now would be premature abstraction
with no second consumer of the shared code yet.

### Consequence

Revisit this decision only when Phase 9 (Capacitor iOS/Android) actually starts.

---

## ADR-020 — pnpm as package manager

- Status: Accepted
- Date: 2026-07-14

### Decision

Use pnpm for dependency management and scripts in this repository.

### Reason

Disk-efficient installs and straightforward future workspace support if ADR-019 is revisited.

---

## ADR-021 — Vitest now, Playwright deferred

- Status: Accepted
- Date: 2026-07-14

### Decision

Configure Vitest for unit tests in the first vertical slice (Phase 0–1). Do not install or
configure Playwright until Phase 2 produces an actual UI flow.

### Reason

`IMPLEMENTATION_PLAN.md` Phase 0 lists both, but there is no UI to exercise end-to-end yet;
installing E2E tooling with nothing to click is premature per the project's anti-over-engineering
rule.

---

## ADR-022 — Gemini key exposure remediated

- Status: Accepted
- Date: 2026-07-14

### Decision

The Gemini key exposure documented in `SECURITY_NOTICE.md` is confirmed remediated: the key
currently in `.env.local` is a newly issued key, not the one pasted into chat. No further rotation
action is required at this time.

### Consequence

Phase 0's "revoke/rotate exposed key" security task is complete. Continue to treat any future
key pasted into chat, logs, or source control as compromised (ADR-006 still applies).

---

## ADR-023 — Unified pipeline stage naming

- Status: Accepted
- Date: 2026-07-14

### Decision

`docs/PRODUCT_SPEC.md` §9 Stage A–H is the authoritative, detailed form of the 10-step pipeline
summarized in `CLAUDE.md` §4. They are the same pipeline at different levels of detail, not two
competing designs.

| CLAUDE.md §4 step | PRODUCT_SPEC §9 stage |
|---|---|
| 1. Normalize user input deterministically | Stage A — Deterministic normalization |
| 2. Build and validate SongDesignSpec | Stage A/B boundary |
| 3. Apply selected composition and lyric rules | Stage B — Theory enrichment |
| 4. Map spec to provider capability profile | Stage C — Provider projection |
| 5. Call Gemini server-side | Stage D — Gemini structured compiler |
| 6. Require structured JSON output validated by Zod | Stage D output contract |
| 7. Run deterministic conflict/capability/overload/safety checks | Stage E — Deterministic validation |
| 8. Run a separate evaluator pass | Stage F — Independent evaluator |
| 9. Permit at most one automatic repair pass | Stage G — Single repair pass |
| 10. Return package plus rationale/warnings/levers | Stage H — Final package |

### Reason

Prevents future contributors from treating these as two different pipelines to reconcile.

---

## ADR-024 — Phase 2 scope trimmed to one dense project page

- Status: Accepted
- Date: 2026-07-14

### Decision

Phase 2's first slice ships auth, Postgres persistence, project CRUD/autosave/versioning, and one
dense project page (North Star, minimal music identity, lyrics, provider selection, compile
results) instead of the full 8-screen wizard in `docs/PRODUCT_SPEC.md` §16.

### Reason

Full Phase 2 as originally scoped (8+ screens, deployment-ready hosting) is too large for one
slice (CLAUDE.md: "do not implement every phase in one turn"). The multi-screen wizard and visual
polish remain a later Phase 2-tail / Phase 7 slice — tracked, not dropped.

---

## ADR-025 — Prisma as ORM/migration tool

- Status: Accepted
- Date: 2026-07-14

### Decision

Use Prisma (v7) with the `@prisma/adapter-pg` driver adapter for Postgres access. Prisma 7 removed
the `url` field from `datasource` blocks in `schema.prisma`; the Prisma CLI reads
`DATABASE_URL` from `prisma.config.ts` (which loads `.env.local`, not `.env`, to share one source
of truth with the Next.js app — see `prisma.config.ts`), and the application passes a
`PrismaPg` adapter to `new PrismaClient({ adapter })` (see `src/lib/prisma.ts`).

### Reason

User-selected (over Drizzle) for its migration tooling and Next.js/Postgres documentation depth.

### Consequence

The generated client lives in `src/generated/prisma` (Prisma 7's new default location, gitignored)
rather than inside `node_modules`. `pnpm install` regenerates it via a `postinstall` script.

---

## ADR-026 — Auth.js v5 (beta), Credentials + JWT, no OAuth adapter

- Status: Accepted
- Date: 2026-07-14

### Decision

Use `next-auth@beta` (Auth.js v5.0.0-beta.31) with the Credentials provider (email + bcryptjs
password hash) and JWT sessions. No `@auth/prisma-adapter` is used — `authorize()` looks up and
verifies the user directly via Prisma, which is sufficient without OAuth/database sessions.

### Reason

User-selected. v5 (even in beta) is the version built for Next.js App Router; v4 targets Pages
Router primarily. "Basic authentication" is all CLAUDE.md's MVP boundary requires.

### Consequence

Revisit when Auth.js v5 reaches GA — pin/upgrade deliberately, don't let it drift silently.

---

## ADR-027 — Local dev Postgres via docker-compose; hosting still pending

- Status: Accepted
- Date: 2026-07-14

### Decision

`docker-compose.yml` provides a one-command local Postgres for development
(`docker compose up -d`). Hosted database and deployment platform remain undecided.

### Reason

This session's sandbox has no Docker/Postgres/psql available, so migrations and a live
signup-to-export walkthrough could not be run or verified here — only `prisma generate` (schema
validity, no live connection needed), typecheck, lint, unit tests (against fakes/mocks), and
`next build` were verified. The live walkthrough and `pnpm test:e2e` are documented as a manual
follow-up for a machine that has Docker/Postgres (see `docs/PHASE_LOG.md`).

---

## ADR-028 — Gemini SDK verification result

- Status: Accepted
- Date: 2026-07-14

### Decision

Verified via WebSearch/WebFetch against ai.google.dev, npmjs.com, and github.com/googleapis/js-genai,
and cross-checked directly against the installed `@google/genai@2.11.0` package's own `.d.ts` files
(not assumed from memory, per ADR-007/IMPLEMENTATION_PLAN.md §3.1):

- Official package: `@google/genai` (unified SDK; the older `@google/generative-ai` is deprecated).
- Structured output goes through the **Interactions API**: `client.interactions.create({ model,
  input, system_instruction, response_format })`. This confirms `GEMINI_API_MODE=interactions` was
  a real, correct value all along, not a nonsense placeholder.
- Parameters are snake_case even in the TS/JS SDK for this API (`system_instruction`,
  `response_format`, `generation_config`, `previous_interaction_id`) — confirmed both in official
  docs and in the package's own type definitions.
- `response_format: { type: "text", mime_type: "application/json", schema: <JSON Schema> }`; result
  arrives as `interaction.output_text` (a JSON string).
- Zod 4 (already a dependency) has built-in `z.toJSONSchema(schema)` — no separate conversion
  library needed.
- The SDK's own `GoogleGenAIRequestOptions` (second argument to `.create()`) has `timeout` and
  `maxRetries` — we use those rather than reimplementing timeout/retry ourselves. `ApiError` (with
  a `.status` HTTP code) is the SDK's exported error class, used to map 429/401/403/5xx to clearer
  messages.
- Model naming (2026-07-14): `gemini-3.5-flash` is what today's official docs pair with the
  Interactions API in every example, and is a real model identifier in the SDK's own `Model_2`
  type union; `gemini-2.5-flash` is the older GA-stable (until Oct 2026) alternative. `GEMINI_MODEL`
  stays fully configurable (ADR-018) regardless.

### Consequence

Resolves the `GEMINI_API_MODE`/model pending-decision item below.

---

## ADR-029 — Gemini is the default compiler/evaluator when configured; dev-only Mock fallback

- Status: Accepted
- Date: 2026-07-14

### Decision

`src/lib/compilerDeps.ts` uses `GeminiPromptCompiler`/`GeminiPromptEvaluator` when
`GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE` are all configured (not placeholders), wrapped so
that in development a failure falls back to the deterministic Mock (`src/llm/devFallback.ts`); in
production the real error is rethrown. Without a configured key (e.g. CI), Mock is used directly,
unchanged from Phase 1 (ADR-011).

### Consequence (live-verified correctness fix)

The dev-fallback wrapper's `metadata` field is mutated per-call to reflect whichever backend
*actually* served that call, not just always the real compiler's. Live testing against a real
Gemini key caught an earlier version of this that always reported Gemini's metadata even on calls
that silently fell back to Mock — which would have permanently mislabeled Mock-produced content as
Gemini output in persisted `PromptPackage` rows. Fixed before merge; see `docs/TROUBLESHOOTING.md`.

---

## ADR-030 — `spec-enrichment.system.md` deferred

- Status: Accepted
- Date: 2026-07-14

### Decision

Of the four system-instruction templates named in IMPLEMENTATION_PLAN.md §3.5, only
`provider-compiler.system.md`, `prompt-evaluator.system.md`, and `prompt-repair.system.md` exist.
`spec-enrichment.system.md` is deferred.

### Reason

PRODUCT_SPEC.md's Stage B (theory enrichment) is deterministic-rules based in the current
pipeline, not a Gemini call — the real theory engines are Phase 4. A template file with no caller
would be dead code. Create it when Stage B actually calls Gemini.

---

## ADR-031 — Theory suggestions: reject via a warning-key list, lock via the existing mechanism

- Status: Accepted
- Date: 2026-07-14

### Decision

The 7 theory engines (`src/theory/`) are pure, deterministic functions producing
`TheoryWarning[]` + notes text. Two interaction primitives satisfy IMPLEMENTATION_PLAN.md Phase 4's
"users can reject or lock suggestions":

- **Reject**: `CompositionTheorySpec.dismissedWarnings: string[]` stores stable keys
  (`"${engine}:${message}"`). A dismissed warning is filtered out of all future engine runs for
  that project. No new persistence concept — it lives inside the existing `songDesignSpec` jsonb
  column, saved through the existing `PATCH /api/projects/{id}`.
- **Lock**: reuses `SongDesignSpec.lockedFields` (already schema-defined since Phase 1) with paths
  like `"compositionTheory.formNotes"`. A locked notes field is never regenerated by the
  orchestrator, keeping whatever value is currently stored.

### Reason

Both mechanisms already existed in the schema/PATCH infrastructure; this avoids inventing a
parallel persistence/API path for what is structurally the same thing ("edit part of the spec and
save it").

### Consequence

A new read-only `POST /api/projects/{id}/analyze` endpoint runs the engines against the *saved*
spec and returns the result without writing anything — dismissing/locking is a normal spec edit
via the existing PATCH, not a separate write path.

---

## ADR-032 — Theory notes fields are always regenerated, not hand-editable, this slice

- Status: Accepted
- Date: 2026-07-14

### Decision

The 8 `compositionTheory.*Notes` text fields are recomputed fresh on every `runTheoryEngines` call
(combining every engine that contributes to a shared field, e.g. `tensionReleaseNotes` from both
`HarmonyGravityEngine` and `RhythmMomentumEngine`) unless the field's path is in `lockedFields`, in
which case the stored value is left untouched. There is no UI for manually typing into these
fields this slice.

### Reason

Since there's no way for a user to hand-author notes text yet, any non-empty value can only have
come from a previous engine run — there's nothing to protect from being overwritten except via an
explicit lock. Deferring manual notes editing (a real feature, but small) keeps this slice about
the engines themselves rather than a second content-editing UI.

---

## ADR-033 — Lyrics drafting: A/B/C generator + deterministic validation, not a 5-step wizard

- Status: Accepted
- Date: 2026-07-14

### Decision

Phase 5's first slice adds a `LyricsDraftGenerator` (Mock + Gemini, same swap/dev-fallback pattern
as `PromptCompiler`/`PromptEvaluator`) that produces 3 lyric drafts (A/B/C) per
`docs/METHODOLOGY.md`'s "compare several drafts before picking a line" practice, plus
`validateLyricsDraftSet()` — a deterministic backstop checking every draft against
`lyricsDesign.lockedLines`, `excludedTechniques`, and direct/simple mode's zero-technique rule.
`LyricsDesignSpec` already had every field this needed (`mode`, `knowHowIntensity`,
`selectedTechniques`/`excludedTechniques`, `culturalProfile`, `pointOfView`, `speaker`/`addressee`,
`lockedLines`, `workflowStage`) since Phase 1 — this slice is the generation mechanism, not new
schema. The full Theme→Ideation→Draft→Melody-fit→Revision wizard (dedicated screens per stage) is
deferred to the Phase 2-tail UI pass.

### Consequence (live-verified correctness fix)

Live testing against real Gemini output found it reporting technique names the user never
selected (e.g. `"직관적 대조"` when only `"공감각적 비유"` was chosen in `selectedTechniques`) — a real
threat to "selected techniques are traceable" (IMPLEMENTATION_PLAN.md Phase 5 Definition of Done).
`validateLyricsDraftSet()` now additionally requires every `techniquesUsed` entry to be a verbatim
member of `selectedTechniques`, rejecting the draft set with a clear error otherwise; the system
instruction was also strengthened to state this explicitly. See `docs/TROUBLESHOOTING.md`.

---

## ADR-034 — Reference/deliberate-differences + structure/emotion-curve UI: extend the one dense page again, order derived from list position

- Status: Accepted
- Date: 2026-07-14

### Decision

The Phase 2-tail UI first slice adds two new sections to the existing single project page
(`ProjectEditor.tsx`) rather than starting the full 8/14-screen wizard from `docs/PRODUCT_SPEC.md`
§16: "Reference & deliberate differences" (`reference`, `deliberateDifferences`) and "Structure &
emotion curve" (`structure`, `emotionCurve`). All four fields have existed on `SongDesignSpec`
since Phase 1; this slice is the UI, not new schema — same category of work as ADR-033's lyrics
drafting slice. This continues ADR-024's precedent rather than reopening it.

`structure` rows expose Move-up/Move-down buttons instead of a manual `order` number field; `order`
is computed from the row's position in the list at save time. A raw integer field the user has to
keep in sync by hand is redundant and error-prone when the list itself already encodes order.

### Reason

Consistent with the established smallest-coherent-slice discipline (CLAUDE.md: "do not implement
every phase in one turn"); the full wizard remains a distinctly larger, separate effort. The
order-by-position mechanic removes a whole class of "list position and order field disagree" bugs
without adding any UI complexity.

### Consequence (live-verified correctness fix)

Live testing found that `handleSave`'s error banner only ever displayed the API's generic
`"Invalid song design spec."` message and silently discarded the specific Zod issue text
(`parsed.error.issues`) the route already returned — meaning the schema's own `.check()` refinement
message ("At least 3 deliberate differences are required...") was unreachable from the UI even
though the server had always computed it correctly. Fixed by having `handleSave` append the joined
`issues[].message` text to the displayed error. See `docs/TROUBLESHOOTING.md`.

---

## ADR-035 — Landing page structurally modeled on nypc.co.kr, overriding Phase 7's "no copied exact layout" guardrail

- Status: Accepted
- Date: 2026-07-14

### Decision

`IMPLEMENTATION_PLAN.md` Phase 7 already named NYPC (nypc.co.kr) as a reference point with an
explicit guardrail: "No copied NYPC assets / No copied exact layout." The user directly instructed
overriding the layout half of that guardrail for the Phase 7 first slice — match NYPC's structure
"as pixel/layout-identical as possible" — after being shown the guardrail and asked to confirm.
Per CLAUDE.md's rule not to silently resolve a conflict between a user instruction and a
source-of-truth document, this is recorded here rather than quietly overridden.

What was reused: the concrete layout mechanics found by fetching the live page and its stylesheets
(specifically `teaser.css`, which is what actually styles the current page — `renewal17.css`/
`common2.css` turned out to be legacy/unused) — a full-viewport 2-section dark scroll layout, a
fixed pill-shaped CTA bar with a bouncing/fading scroll-hint chevron, absolute-positioned hero
content near the bottom of the viewport, and a second section with a media block above a
divided description list (each subsequent `dt`/`dd` pair gets a top divider + extra margin).
Measurements (font sizes, gaps, button height/radius, breakpoints) were carried over closely.

What was **not** reused, regardless of the layout override: NYPC's actual brand name/copy, their
video/image assets, their licensed display font (`poster-gothic-cond-atf`, a paid Adobe Typekit
font — not something this project has a license for), or their divider image asset. These are
genuine trademark/licensing boundaries independent of the internal "guardrail," not just a stricter
reading of it. Colors use this project's own existing dark-theme tokens
(`--color-accent-primary`/`--color-accent-secondary`, `src/app/globals.css`) instead of NYPC's
red/blue gradient, and the existing Geist font already wired up in `layout.tsx`. Copy is Music
Prompt Architect's own real product framing (Safe/Balanced/Bold, the 7 theory engines), not a
translation of NYPC's.

### Reason

The user made an informed choice after seeing the pre-existing guardrail and its rationale; this
is a one-time recorded exception for this slice, not a silent repeal of the guardrail for future
Phase 7 work (Sound Seed Orb, live demo, methodology story, etc. remain free to diverge from NYPC
as originally planned).

### Consequence (live-verified layout bug found and fixed)

A first screenshot-based check found the fixed CTA bar visually overlapping the last description
item in the second section — the same reason NYPC's own CSS has
`.section-contents .teaser-info { padding-bottom: 160px; }`, which had been missed when porting the
layout over. Fixed by adding equivalent bottom padding to `.detailSection`. See
`docs/TROUBLESHOOTING.md`.

---

## ADR-036 — Anonymous "try it now" demo is Mock-only by construction; hero background art sourcing

- Status: Accepted
- Date: 2026-07-14

### Decision

The user asked to remove the login/signup requirement so visitors can use the prompt-writing
feature immediately on scroll. This was flagged as conflicting with `CLAUDE.md` §6's MVP
requirement ("basic authentication and project ownership") and Phase 2's tested "another user
cannot access it" guarantee — per `docs/docs/CLAUDE_SELF_DIRECTED_OPERATING_MANUAL.md`, both
"인증·보안 변경" and "비용이 큰 외부 API 실행" are explicit approval-gate categories. The user
confirmed (via `AskUserQuestion`, then a follow-up message): keep the existing account/ownership
system exactly as it is; add a separate, unauthenticated "try it now" demo alongside it.

The demo (`src/app/api/demo/compile/route.ts`) is **Mock-compiler-only by construction, not by
convention** — it hand-builds its own `CompilePipelineDeps` (`new MockPromptCompiler()`, `new
MockPromptEvaluator()`, `new InMemoryProviderRegistry()`) instead of importing
`compilePipelineDeps` from `src/lib/compilerDeps.ts`, which resolves to real Gemini whenever
`GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE` are configured (they are, in this project's
`.env.local`). It also imports neither `@/lib/authz` nor any repository/`prisma` call — no auth
dependency, no persistence, at all. `idea` is capped at 2000 characters via Zod.

### Reason

There is no rate-limiting infrastructure yet (a pending gap since Phase 0). An anonymous route
that could reach a real, billable Gemini call would be an uncontrolled cost/abuse surface with no
mitigation in place. Making it structurally impossible to reach Gemini (not importing the module
that could resolve to it) removes the risk entirely without needing to build a rate limiter first —
a "choose a low-risk default and record it" call per the self-directed manual, rather than a
question requiring separate approval, since the account/ownership system itself is unchanged.

### Hero background art sourcing

Two Beethoven portraits, verified genuinely public domain (not merely "freely licensed by a modern
photographer") via their Wikimedia Commons file pages and a `curl -I` confirming each resolves to a
real `200 image/jpeg`, then self-hosted in `public/images/hero/`:

- Joseph Karl Stieler, 1820 — artist died 1858 (PD-old-100-expired / CC-PD-Mark) —
  source: `https://upload.wikimedia.org/wikipedia/commons/6/6f/Beethoven.jpg`
- Joseph Willibrord Mähler, 1804–05 — artist died 1860 (public domain / CC-PD-Mark) —
  source: `https://upload.wikimedia.org/wikipedia/commons/7/7b/Beethoven_3.jpg`

Chosen after the user's original request (photos of Beethoven, Bob Dylan, the Beatles, Michael
Jackson, BTS, Queen) was flagged as a real right-of-publicity/copyright risk for every name except
Beethoven — living artists and estates/labels (Dylan, BTS especially) actively enforce image
rights, and professional photography of all of them is copyrighted regardless. The user first
narrowed to "Beethoven only," then relaxed to "appropriately musical and artistic," which these
still satisfy.

### Consequence (real gap found and fixed during implementation)

`MockPromptCompiler`'s `fields.lyrics` derives only from `lyricsDesign.originalLyrics`/
`lockedLines` (`src/llm/mock/mockOutputBuilders.ts`), not from `northStar` — the first version of
the demo route only set `northStar.audienceExperience`, so every demo result silently had an empty
"Lyrics" field. Fixed by also seeding `lyricsDesign.originalLyrics` with the user's typed idea.

---

## ADR-037 — Landing page restructured into 5 sections; no fabricated stats or testimonials; CSS Modules kept over Tailwind

- Status: Accepted
- Date: 2026-07-14

### Decision

The user shared a generic prompt template (their own summary of a "build a landing page with
Claude Code" tutorial) asking for a 5-section structure (Hero / Problem / Service / Testimonial /
CTA) with copy grounded in specific numbers and situations. `src/app/page.tsx` is now a thin
composition of 5 section components, each with its own co-located CSS module:
`Hero.tsx`/`.module.css`, `Problem.tsx`/`.module.css` (new), `Service.tsx`/`.module.css` (restructures
the former `detailList` into outcome-framed cards), `Craft.tsx`/`.module.css` (new — see below),
`CTA.tsx`/`.module.css` (wraps the existing `DemoForm` unchanged). A shared `Reveal.tsx` component
(`IntersectionObserver`-based fade+slide-up, reduced-motion aware via a lazy `useState` initializer
rather than a synchronous `setState` call in `useEffect` — the latter is flagged by this project's
`react-hooks/set-state-in-effect` lint rule) wraps each section below the hero.

Two things in the template were **not followed literally**, on integrity grounds:

- The template's example pain-point numbers ("효율 40% 절감," "127건," "12시간") are generic
  B2B-SaaS placeholders, not measured facts about this product. The Problem/Service copy instead
  uses concrete, true claims about what the system actually, verifiably does (7 named theory
  engines, 3 parallel strategies, A/B/C lyric drafts with locked-line preservation) rather than
  invented metrics.
- The template's Testimonial section asks for first-person customer quotes. This product has no
  real users yet — fabricating named quotes and presenting them as genuine would be a real
  deception on a live page, the same "never fabricate reviews/testimonials presented as genuine"
  boundary that applies to anything published, not a stylistic call. That slot is replaced with
  **Craft** — three real principles pulled from `docs/METHODOLOGY.md`/`CLAUDE.md` (reference is
  function not surface copy + the 3-difference gate; direct/simple lyrics as a complete option;
  locked lines survive every revision), framed as "why this exists" and truthfully subtitled "not
  marketing claims — rules enforced in the code."

The template specified Tailwind CSS; this project keeps **CSS Modules** instead. There was no
Tailwind dependency before this task, the existing token layer in `globals.css` (dark theme,
accent palette, responsive breakpoints, the global `prefers-reduced-motion` rule) already built
the whole landing page successfully, and introducing a second styling system (or a full-site
migration) for one page has no concrete benefit here — "새 Dependency는 이유가 있을 때만 추가한다"
(the self-directed manual, and CLAUDE.md's engineering defaults in spirit). The requested
"artistic" color direction is realized as two new tokens, `--color-accent-crimson`/
`--color-accent-gold` (`globals.css`), extending — not replacing — the existing purple/teal pair,
picked to tie into the Beethoven portrait hero art already in place rather than typical SaaS
blue/green.

### Reason

The user explicitly delegated layout and asked for "artistic" colors without specifying an exact
palette, and gave standing autonomy for this task ("중간중간에 확인받을 필요 없어... 오류만 아니면
스스로 진행해줘") — these are the "choose a reasonable low-risk default and record it" calls the
self-directed manual describes, not decisions requiring a fresh question each time. The two
integrity departures above (no fake stats, no fake testimonials) are not close calls and were made
without asking, consistent with the manual's own instruction not to fold every judgment call back
into a question.

### Consequence (live-verified layout bug found and fixed)

The first screenshot pass showed Hero's CTA bar (`position: fixed`, inherited from when the page
had only 2 sections and a page-wide floating bar made sense) overlapping the Problem section's
text — with 5 sections now on the page, anything `position: fixed` persists over all of them, not
just the hero. Fixed by changing `.ctaBar` to `position: absolute` scoped to `.hero` (which is
`position: relative`), so it scrolls away naturally with the hero section instead of floating over
everything below it; the compensating extra bottom padding on the CTA section (previously needed
to keep content clear of the old fixed bar) was removed since it's no longer needed. See
`docs/TROUBLESHOOTING.md`.

---

## ADR-038 — No-login demo moved into Hero (above the fold); dedicated CTA section removed

- Status: Accepted
- Date: 2026-07-15

### Decision

The user asked to move the actual prompt-writing demo into the screen that's visible immediately
on landing, with the explanatory sections (Problem/Service/Craft) following below as a scrolled
list. `DemoForm` (unchanged component and `/api/demo/compile` route) now renders inside `Hero.tsx`,
directly below the headline/description and above the Sign up/Log in links and the scroll hint.
The previously separate `CTA.tsx`/`CTA.module.css` section (which only ever wrapped `DemoForm` at
the bottom of the page) is now redundant and was deleted rather than kept as a second, duplicate
copy of the same form.

`Hero.module.css` changed from `height: 100vh` with absolutely-positioned, bottom-anchored content
and a separately-fixed CTA bar (ADR-037's fix) to `min-height: 100vh` with the content column laid
out in normal flow, centered via flexbox. This is simpler and more robust than the previous
bottom-anchored-with-manual-margin approach — it doesn't need per-breakpoint `margin-bottom` hacks
to keep content clear of a fixed element, and it naturally accommodates the demo form's variable
height (empty vs. showing a generated result) without needing to know that height in advance.
Sign up/Log in changed from large pill buttons to small underlined text links, since the demo's
own "Generate" button is now the primary call to action on this screen; the pill-button treatment
would have visually competed with it.

### Reason

Live-verified at 1280×720, 1440×900 (typical laptop heights), and 375×812 (mobile) that the full
headline + description + demo form + auth links + scroll hint fit within a single viewport at
every size tested, with the scroll-hint chevron still visible confirming there's more to scroll to
— the core ask ("visible as soon as you land, no scrolling required") is met, not just approximated.

### Consequence

`tests/e2e/landing.spec.ts` updated: removed the "Try it right now" heading assertion (that section
no longer exists), added a dedicated case asserting the demo's textarea and Generate button are
visible immediately on `page.goto("/")` with no scroll action first, and changed the post-generate
assertion from a bare `getByText(/Sign up/).last()` (ambiguous now that "Sign up" appears twice in
the same section — the auth link and the demo's upsell link) to the specific upsell sentence text.

---

## ADR-039 — Login/signup restyled to match the landing page; compile history (not chat history) added

- Status: Accepted
- Date: 2026-07-15

### Decision

Two follow-on requests. First: restyle `/login` and `/signup` to match the landing page's dark,
artistic design system rather than their previous unstyled default-light form. New shared
`src/app/AuthForm.module.css` (card layout, `demoButton`-style crimson→gold gradient submit
button, `HeroBackground`'s Beethoven art reused as the page background) is imported by both pages;
no new component duplication beyond the one shared module.

Second: the user asked for something like ChatGPT/Gemini's "view past conversations" after
logging in. This product has no chat/conversational data model — Projects are structured specs,
not message threads — so a literal equivalent doesn't exist. Investigated what *does* exist:
`ProjectVersion` rows (a full spec snapshot per save, already written on every `PATCH`) and
`PromptPackage` rows (every past compile result, already written on every `POST .../compile/compare`)
are both already persisted, timestamped, and simply never read back as a list — only the current
version/latest result was ever shown. Presented this finding plus both options to the user via
`AskUserQuestion`; **compile history was chosen** (project version history / "diff over time" was
not built this round, and remains available as a future option since the underlying data already
exists for it too).

New `GET /api/projects/{id}/history` (ownership-checked via the existing `requireOwnedProject`,
same pattern as every other project route) returns up to the 50 most recent `PromptPackage` rows
for a project, newest first, with `style`/`lyrics` extracted from the `fields` JSON column. New
"View history" button in `ProjectEditor.tsx` renders the list with an expandable Style/Lyrics view
per entry — no new persistence, this is a pure read of data the app already collects.

### Reason

Restyling the auth pages closes an obvious visual inconsistency now that the landing page has a
real design system. The history feature was scoped to what the data already supports rather than
building a new conversation/message data model to imitate a chat product this app fundamentally
isn't — reusing existing, already-written data is lower-risk and ships faster than modeling
something new.

### Consequence

New `tests/unit/apiProjectHistoryRoute.test.ts` (401/403/404 ownership cases + a 200 case
asserting newest-first ordering and correct `style`/`lyrics` extraction) — 127 unit tests total
(up from 123). Live-verified end-to-end (signup → project → compile → View history → expand) by
temporarily running a second dev-server pass with `GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE`
blanked (forcing the existing Mock path via `isGeminiConfigured()`, `src/lib/env.ts`) to get a fast,
deterministic compile — the real-Gemini path hit the same pre-existing latency flake documented
under Phase 7's third slice (a real compile took as long as 40s in one attempt), which is unrelated
to this feature and not something this change needed to fix to verify the new history logic itself.

---

## ADR-040 — Explanatory sections given a livelier, "music-prompt-site" visual treatment

- Status: Accepted
- Date: 2026-07-15

### Decision

The user asked for the Problem/Service/Craft sections (the scrolled explanation content below the
hero) to feel more "톡톡 튀는" (bouncy/lively) — fitting for a site whose whole product is about
music, not a dry enterprise dashboard. Changes, all additive to the existing structure:

- `Reveal.tsx` gained an optional `delayMs` prop so cards within a section can pop in staggered
  rather than all at once; `globals.css`'s shared `.reveal` transition changed from a plain `ease`
  fade+slide to a back-out overshoot easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) plus a subtle
  scale — a "bounce," not just a fade.
- `Service.tsx`/`Craft.tsx` cards each get a distinct accent color (cycling through the existing
  `--color-accent-primary`/`--color-accent-secondary`/`--color-lyrics`/`--color-accent-crimson`/
  `--color-accent-gold` tokens — no new colors introduced) as a top border, a matching hover-glow
  shadow, and a small hover lift; `Problem.tsx`'s headline gained a gradient-text accent span.
- **New 4th Craft card**, added honestly rather than as unsupported marketing copy: verified via
  `knowledge/composition_theory/top_music_school_general_composition.txt` and
  `docs/METHODOLOGY.md` (which names Berklee/USC Thornton/NYU Steinhardt/Juilliard curricula and
  cites lyricist Kim Eana's and K-pop lyric-team practice by name) that the 7 theory engines and
  lyric technique menu genuinely *do* implement principles from those real sources — this isn't a
  fabricated claim like the stats/testimonials declined in ADR-037, it's citing a source this
  project's own documentation already names. Copy explicitly disclaims guaranteeing a hit song,
  consistent with CLAUDE.md §3.

### Reason

"Lively" was interpreted as motion + color variety within the existing token system and honest
copy — not a request to add new colors, fonts, or unverified claims. Reusing existing accent tokens
keeps the palette coherent instead of introducing a competing color scheme.

---

## Pending decisions

The following must be decided after repository inspection, and remain open:

- Database hosting (production/staging)
- Deployment platform
- Budget-limit policy for Gemini usage (per-user cap? global cap? none for now?) — needed before
  IMPLEMENTATION_PLAN.md §3.7's "budget limit" resilience item can be implemented; this is a
  product policy decision, not an engineering one.
- Logging and observability provider
- Rate-limit implementation (an app-level system, distinct from the single-Gemini-429 handling
  ADR-029 already covers)
- Background-job requirement

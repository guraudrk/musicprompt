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

## Pending decisions

The following must be decided after repository inspection, and remain open:

- Database hosting (production/staging)
- Deployment platform
- `GEMINI_API_MODE` value and current Gemini model — `.env.example` currently has
  `GEMINI_API_MODE=interactions`, which is a placeholder not defined by any source document or
  verified against current official Google GenAI SDK docs. Must be verified before Phase 3 real
  Gemini wiring, per ADR-007.
- Logging and observability provider
- Rate-limit implementation
- Background-job requirement

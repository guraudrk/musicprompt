# Phase completion log

Append-only record of each phase's completion, kept in sync with `IMPLEMENTATION_PLAN.md` status
changes. Each entry is added by whoever/whatever closes out that phase, alongside the README
update, commit, and push to `origin/main` (https://github.com/guraudrk/musicprompt) for that phase.

---

## Phase 0–1 — Repository foundation, canonical domain, Mock compiler

- Date: 2026-07-14
- Status: first-slice scope complete (see `IMPLEMENTATION_PLAN.md` Phase 0/1 checklists for what
  is explicitly deferred to Phase 2, e.g. Postgres, CI, Playwright, auth).

### What shipped

- Next.js App Router + TypeScript strict, pnpm, Vitest, ESLint.
- `SongDesignSpec` and all sub-schemas as Zod schemas (`src/domain/`).
- `MusicAIPromptPackage`, `ProviderCapabilityProfile`, `PromptQualityReport` domain types/schemas.
- Generic / Suno / Udio provider capability profiles (versioned seed data) + `ProviderRegistry`.
- `MockLLMProvider` / `MockPromptCompiler` / `MockPromptEvaluator` — deterministic Stage A–H proof.
- `GeminiLLMProvider` / `GeminiPromptCompiler` / `GeminiPromptEvaluator` — server-only interface
  skeletons (no live network call; real wiring is Phase 3, pending SDK/API-mode verification).
- `compiler/pipeline.ts` orchestrating Stage C–H (Safe/Balanced/Bold).
- In-memory `Project` domain model/repository (no DB yet).
- Minimal layout + design tokens (full landing page is Phase 7).
- `docs/ARCHITECTURE.md` (pipeline diagram, module map, ERD draft).
- 18 Vitest unit tests covering schema validation, provider registry, mock pipeline determinism,
  locked-lyric preservation, unsupported-intent preservation, Safe/Balanced/Bold differentiation,
  and the Gemini skeleton's error behavior.

### Verification at time of this entry

- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm test` — 18/18 pass
- `pnpm build` — pass

### Decisions recorded

See `DECISIONS.md` ADR-019 through ADR-023.

### Known gaps carried forward

- No ORM/auth/DB/CI yet (Phase 2).
- `GEMINI_API_MODE` value is an unverified placeholder (must verify before Phase 3 real wiring,
  per ADR-007).

---

## Phase 2 — Persistence, auth, and core web flow (first slice)

- Date: 2026-07-14
- Status: **DONE, live-verified** (see "Live verification" addendum below — the user installed
  Docker Desktop specifically so this phase could be tested against a real Postgres instead of
  staying at "code-complete, not run" indefinitely).

### What shipped

- Prisma 7 schema (`User`, `Project`, `ProjectVersion`, `PromptPackage`) + `@prisma/adapter-pg`
  driver adapter (`src/lib/prisma.ts`) — Prisma 7 dropped `url` from `datasource` blocks, so the
  CLI reads `DATABASE_URL` from `prisma.config.ts` (pointed at `.env.local`, not the default
  `.env`, to keep one source of truth with the Next.js app).
- `PrismaProjectRepository` implementing the same `ProjectRepository` interface Phase 1 defined
  (`InMemoryProjectRepository` stays for pure unit tests) — `ProjectRepository` became async to
  accommodate real I/O.
- Auth.js v5 beta, Credentials provider (email + bcryptjs), JWT sessions, no OAuth adapter
  (`src/auth.ts`) + `/api/auth/signup`.
- Project CRUD, autosave (PATCH bumps version server-side), compile (`compile/{providerId}` and
  `compile/compare`, wired to the existing Mock pipeline — Gemini stays a skeleton), and TXT/JSON
  export API routes, all enforcing per-user ownership (`src/lib/authz.ts`).
- One dense project page (`/projects/[id]`) instead of the full 8-screen wizard — North Star,
  minimal music identity, lyrics + locked lines, provider selection, Safe/Balanced/Bold results
  with copy-to-clipboard, export links. Plus `/signup`, `/login`, `/dashboard`.
- `docker-compose.yml` for local Postgres.
- New unit tests: `PrismaProjectRepository` against a hand-written fake Prisma Client, and
  `/api/projects/[projectId]` route ownership/version-bump behavior against a mocked session +
  repository. Total: 25 unit tests (up from 18).
- `tests/e2e/happy-path.spec.ts` (Playwright) — signup → create → edit → compile → copy/export.

### Verification at time of this entry

Actually run in this sandbox:
- `pnpm typecheck` — pass
- `pnpm lint` — pass
- `pnpm test` — 25/25 pass
- `pnpm build` — pass (all routes compiled, including the new dynamic API routes)
- `pnpm exec prisma generate` — pass (schema is valid; does not require a live DB connection)

**Not run here — no Docker/Postgres/psql available in this sandbox:**
- `pnpm prisma migrate dev` (never applied against a real database)
- The actual signup → create project → compile → reload → export walkthrough
- `pnpm test:e2e` (Playwright was never launched)

So "another user cannot access it" and "reloading preserves the project" are enforced in code and
covered by mocked/faked unit tests, but not confirmed against a real second account or a real
reload. Whoever runs this next on a machine with Docker should do the walkthrough in
`README.md`'s "로컬에서 DB 붙여서 확인하기" section before trusting this phase is fully done.

### Live verification (same day, after Docker Desktop was installed)

The user installed Docker Desktop specifically to close the gap above. Ran, on this same machine:

1. `docker compose up -d` — Postgres container up, `pg_isready` confirmed.
2. `pnpm prisma migrate dev --name init` — first attempt failed with `P1000: Authentication
   failed ... for USER` because `.env.local`'s `DATABASE_URL` still had the pre-Docker placeholder
   credentials; fixed to match `docker-compose.yml`'s `postgres:postgres`, then migration applied
   cleanly. Confirmed via `psql \dt`: `User`, `Project`, `ProjectVersion`, `PromptPackage`,
   `_prisma_migrations` all created.
3. `pnpm dev`, then exercised the real API with `curl` end-to-end: signup → CSRF-token login →
   `/api/auth/session` confirmed → create project → PATCH (edited North Star, working title,
   locked lyric line; version 1 → 2, confirmed via a follow-up GET) → `compile/compare` for
   `generic` (Safe/Balanced/Bold returned, each with the locked lyric line intact, each with a
   different `style` string) → TXT and JSON export both returned correctly.
4. Signed up a **second** real account and confirmed `GET /api/projects/{id}` on the first user's
   project returns `403`, and the second user's own project list is empty.
5. `pnpm exec playwright install chromium` then `pnpm test:e2e` — failed twice, fixed both (see
   `docs/TROUBLESHOOTING.md`: a locator ambiguity in the test itself, and a missing clipboard
   permission grant + missing error handling in `ProjectEditor.tsx`'s copy button, which was a real
   app gap, not just a test bug). Third run passed.

All four `IMPLEMENTATION_PLAN.md` Phase 2 "Definition of done" items are now checked off for real,
not just asserted. A full technical-issues write-up (this phase and Phase 0-1 combined) is in
`docs/TROUBLESHOOTING.md`.

### Decisions recorded

See `DECISIONS.md` ADR-024 through ADR-027.

### Known gaps carried forward

- Full 8-screen wizard UI, reference/deliberate-differences editing, structure/emotion-curve
  editing — not exposed in this slice's single-page form (schema/backend already support them).
- True optimistic-concurrency conflict rejection — this slice always overwrites with a
  server-incremented version instead of rejecting stale client writes.
- DB hosting, deployment platform, logging/observability, rate limiting, background jobs — still
  pending (see `DECISIONS.md`).

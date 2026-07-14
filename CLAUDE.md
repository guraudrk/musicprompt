# Music Prompt Architect — Claude Code Instructions

## 1. Project mission

Build a web and mobile-ready prompt-design platform that converts a user's musical idea into tool-specific prompts for multiple music-generation AIs.

This product does not generate music itself in the MVP. It creates, validates, compares, stores, and improves prompt packages.

## 2. Source of truth

Read only the files relevant to the current task.

- Product requirements: `docs/PRODUCT_SPEC.md`
- Music and lyric methodology: `docs/METHODOLOGY.md`
- Current implementation plan: `IMPLEMENTATION_PLAN.md`
- Architectural decisions: `DECISIONS.md`
- Composition knowledge: `knowledge/composition_theory/top_music_school_general_composition.txt`
- User lyric know-how: `knowledge/lyrics/user_lyrics_knowhow.txt`

When requirements conflict, use this priority:

1. Security and privacy
2. `CLAUDE.md`
3. `DECISIONS.md`
4. `docs/PRODUCT_SPEC.md`
5. `IMPLEMENTATION_PLAN.md`
6. `docs/METHODOLOGY.md`
7. Knowledge files

Do not silently resolve material conflicts. Record the decision in `DECISIONS.md`.

## 3. Non-negotiable product rules

- Use a canonical `SongDesignSpec` before compiling any provider prompt.
- Keep provider capabilities in a versioned Provider Registry, not scattered conditionals.
- Preserve unsupported user intents instead of deleting them.
- Never claim to guarantee a hit song, exact musical quality, or exact provider compliance.
- Do not implement unofficial APIs, scraping, automated login, or terms-of-service workarounds.
- Do not imitate a living artist's voice or produce a direct style clone.
- Reference songs are analyzed for functional principles, not copied at the surface level.
- Direct and simple lyrics are a complete option, not a lower-quality fallback.
- Preserve user-written lyrics and locked lines unless the user explicitly allows rewriting.
- Separate generation from evaluation.
- Prefer local, targeted revision over regenerating an entire project.

## 4. Gemini integration rules

Gemini is the final structured compiler and language polisher, not the sole source of musical truth.

Required pipeline:

1. Normalize user input deterministically.
2. Build and validate `SongDesignSpec`.
3. Apply selected composition and lyric rules.
4. Map the spec to the selected provider capability profile.
5. Call Gemini from server-side code only.
6. Require structured JSON output validated by Zod.
7. Run deterministic conflict, capability, overload, and safety checks.
8. Run a separate evaluator pass.
9. Permit at most one automatic repair pass for schema or blocking validation failures.
10. Return the prompt package plus rationale, warnings, and revision levers.

Never expose `GEMINI_API_KEY` to browser code, logs, generated files, error messages, or analytics.

Use environment variables:

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_API_MODE`

Verify the current official Google GenAI SDK and Gemini API shape before implementation. Keep Gemini behind an adapter so the API can be migrated without changing domain logic.

## 5. Development workflow

For multi-file or architectural work:

1. Explore the repository.
2. Read the relevant source-of-truth documents.
3. Use plan mode.
4. Update `IMPLEMENTATION_PLAN.md`.
5. Implement the smallest runnable slice.
6. Run lint, type-check, unit tests, integration tests, and relevant E2E tests.
7. Fix failures before claiming completion.
8. Update `DECISIONS.md` when a durable architectural choice is made.
9. Summarize changed files, tests run, remaining risks, and next step.

Do not implement every phase in one turn.

## 6. Initial MVP boundary

Implement first:

- Project CRUD and autosave
- North Star input
- Basic `SongDesignSpec`
- Generic, Suno, and Udio provider profiles
- Mock LLM provider
- Gemini compiler adapter
- Safe / Balanced / Bold prompt packages
- Conflict and capability checks
- Copy and TXT/JSON export
- Responsive web UI
- Basic authentication and project ownership

Do not implement in the first slice:

- External music generation
- Audio analysis
- Payments
- Collaboration
- Seven full provider integrations
- iOS and Android store releases
- Heavy 3D/WebGL effects

## 7. Engineering defaults

- TypeScript strict mode
- Next.js App Router
- Zod at all external and AI boundaries
- PostgreSQL
- Server-only AI calls
- Provider and LLM adapter patterns
- Mock providers for CI
- Accessible responsive UI
- Structured logs without raw lyrics or secrets
- Migrations for schema changes
- Idempotent autosave and revision APIs

## 8. Quality bar

A task is not complete until:

- It builds.
- Type-check passes.
- Tests pass.
- Failure states are handled.
- No secret is present in source control.
- The implementation matches the source-of-truth documents.
- The user can understand what changed.

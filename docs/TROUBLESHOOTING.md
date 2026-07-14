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

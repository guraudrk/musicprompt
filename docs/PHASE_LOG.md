# Phase completion log

Append-only record of each phase's completion, kept in sync with `IMPLEMENTATION_PLAN.md` status
changes. Each entry is added by whoever/whatever closes out that phase, alongside the README
update, commit, and push to `origin/main` (https://github.com/guraudrk/musicprompt) for that phase.

각 Phase 항목은 "### 한글 요약" 섹션(무엇을 만들었는지, 무엇을 검증했는지, 무엇이 남았는지)을 영문 상세
내용 앞에 포함합니다. 사용자 요청(2026-07-14)에 따라 지금부터 계속 이 형식을 유지합니다.

---

## Phase 0–1 — Repository foundation, canonical domain, Mock compiler

- Date: 2026-07-14
- Status: first-slice scope complete (see `IMPLEMENTATION_PLAN.md` Phase 0/1 checklists for what
  is explicitly deferred to Phase 2, e.g. Postgres, CI, Playwright, auth).

### 한글 요약

- **무엇을 만들었나**: Next.js 앱 뼈대(TypeScript strict, pnpm, Vitest, ESLint), `SongDesignSpec`을
  비롯한 도메인 Zod 스키마 전체, Generic/Suno/Udio Provider 등록소, 결정론적 Mock LLM
  Provider/Compiler/Evaluator, Gemini 어댑터 골격(아직 실제 네트워크 호출 없음), Safe/Balanced/Bold를
  만들어내는 컴파일 파이프라인(Stage A-H), 아키텍처 문서(`docs/ARCHITECTURE.md`).
- **검증**: 유닛 테스트 18개, 타입체크·린트·빌드 전부 통과.
- **남은 것**: 인증·DB·CI 없음(Phase 2에서 해결), `GEMINI_API_MODE` 값이 검증되지 않은 placeholder였음
  (Phase 3에서 실제로 맞는 값이었다고 확인됨).

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

### 한글 요약

- **무엇을 만들었나**: Prisma 7 + Postgres 영속성(User/Project/ProjectVersion/PromptPackage), Auth.js
  이메일/비밀번호 인증(JWT 세션), 소유권이 강제되는 프로젝트 CRUD·자동저장·컴파일·내보내기 API, 8단계
  위저드 대신 축소한 단일 페이지 프로젝트 편집기, 로컬 Postgres용 `docker-compose.yml`.
- **처음엔 실행 못 해봄**: 이 코드를 작성한 샌드박스에는 Docker/Postgres가 없어서 "코드는 완성했지만
  실제로 돌려보진 못함" 상태로 남아 있었습니다.
- **사용자가 Docker Desktop을 설치해서 실제로 검증**: 회원가입 → 프로젝트 생성 → 저장 → 컴파일 →
  내보내기까지 curl로 직접 실행, 두 번째 계정으로 접근 시 403 확인, Playwright 테스트까지 실제 실행해서
  통과시킴.
- **실제로 돌려보다가 진짜 버그 2개 발견해서 고침**: Playwright 테스트의 로케이터 모호성 문제, 그리고
  클립보드 복사 버튼의 권한/에러 처리 누락(실제 앱 버그).
- **남은 것**: 8단계 위저드 UI·레퍼런스/차이점 편집, 진짜 optimistic concurrency, DB 호스팅/배포 플랫폼
  등은 아직 미정.

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

---

## Phase 3 — Gemini structured compiler (first slice)

- Date: 2026-07-14
- Status: **DONE, live-verified against the real Gemini API** — the user's own question ("왜
  도커를 설치한 거야?") from Phase 2 carried forward the same lesson here: don't trust
  code-complete-but-unexecuted claims, actually run it.

### 한글 요약

- **무엇을 만들었나**: 공식 `@google/genai` SDK의 Interactions API로 실제 Gemini 구조화 출력 컴파일러를
  연결했습니다. 공식 문서뿐 아니라 **설치된 패키지의 실제 타입 정의 파일을 직접 열어서** 파라미터명
  (snake_case), 응답 형식, 에러 클래스까지 추측 없이 확인했습니다. Gemini가 이제 기본 컴파일러/평가자이고,
  개발 환경에서만 실패 시 Mock으로 자동 전환되며 프로덕션은 실제 에러를 그대로 보여줍니다. 컴파일 호출
  메타데이터(모델명, 지연시간, 재시도 횟수 등)를 DB에 저장하도록 마이그레이션도 추가했습니다.
- **실제 API 키로 라이브 검증**: Safe·Balanced 전략이 실제로 성공해서 "The ghost I chased was always
  in the room" 같은 진짜 창작적인 가사를 만들어냈고, 잠금 가사 문장("I never found the one who broke
  me.")도 그대로 보존됐습니다.
- **이 라이브 테스트 중 진짜 버그 하나 발견**: Mock 폴백이 실제로 작동했는데도(즉 Mock이 응답을 만들었는데도)
  메타데이터에는 항상 "gemini-3.5-flash가 응답했다"고 잘못 기록되는 문제를 발견했습니다. 유닛 테스트로는
  못 잡았을 문제였고, DB에 저장된 실제 값을 눈으로 확인하다가 발견해서 바로 고쳤습니다.
- **처음 잡았던 30초 타임아웃도 너무 짧다는 걸 실측으로 확인**해서 60초로 늘렸습니다.
- **남은 것**: `spec-enrichment` 프롬프트 템플릿은 아직 만들 이유가 없어서 보류, Gemini 사용량 예산 제한
  정책 미정, 실패한 호출의 메타데이터는 아직 저장하지 않음.

### What shipped

- SDK verification (ADR-028) via WebSearch/WebFetch against ai.google.dev, npmjs.com,
  github.com/googleapis/js-genai, **and** direct inspection of the installed
  `@google/genai@2.11.0` package's own `.d.ts` files (not assumed from memory, not from old
  examples). Confirmed: `@google/genai` is the official SDK, the Interactions API
  (`client.interactions.create`) is the current structured-output mechanism, `GEMINI_API_MODE=
  interactions` was a real correct value all along, parameters are snake_case even in the JS SDK,
  and Zod 4 already has `z.toJSONSchema()` built in.
- Real `GeminiLLMProvider` (`src/llm/gemini/geminiLLMProvider.ts`) — no more "server-only skeleton"
  throw. Converts the given Zod schema to JSON Schema, calls the Interactions API with
  `system_instruction`/`response_format`, parses `output_text` back through the original Zod
  schema.
- `src/llm/gemini/resilience.ts` — uses the SDK's own `timeout`/`maxRetries` options (found by
  reading its type definitions) rather than reimplementing retry logic; `mapGeminiError` gives
  429/401/403/5xx clear, distinct messages via the SDK's exported `ApiError` class.
- Three of the four system-instruction templates from IMPLEMENTATION_PLAN.md §3.5
  (`provider-compiler`, `prompt-evaluator`, `prompt-repair` — `spec-enrichment` deferred, ADR-030),
  read from `src/llm/gemini/prompts/*.system.md` via a small `readTemplate()` helper.
- `src/llm/devFallback.ts` — Gemini is now the default compiler/evaluator when configured
  (ADR-029); a failure falls back to Mock in development only, production surfaces the real error.
- Compile-call metadata (model, API mode, prompt-template version, schema version, latency, repair
  count) persisted on `PromptPackage` via a new migration
  (`20260714063919_add_compile_metadata`) with backfill defaults for the 12 pre-existing local rows.
- 24 new unit tests (52 total, up from 25): mocked `@google/genai` client for `GeminiLLMProvider`
  (schema conversion, output parsing, 429 mapping), `GeminiPromptCompiler`/`GeminiPromptEvaluator`
  (template loading, metadata), `devFallback` (fallback + metadata correctness), `isGeminiConfigured`.

### Live verification (real Gemini API calls, not simulated)

With explicit user permission (small real cost/quota use), ran the actual compile endpoint against
the real rotated key in `.env.local`:

- First attempt at a 30s timeout: all three Safe/Balanced/Bold calls timed out and correctly fell
  back to Mock (proving the fallback path works) — but that meant no real content yet. A minimal
  isolated test script showed a plain call takes ~17s and a small structured-output call ~19s, so
  30s was too tight once the *actual* large `MusicAIPromptPackageSchema` and three concurrent
  requests were involved. Bumped the SDK timeout to 60s (ADR/IMPLEMENTATION_PLAN §3.7 updated).
- Second attempt: **Safe and Balanced strategies both succeeded for real.** Gemini produced
  genuinely distinct, on-theme creative content for each strategy — e.g. Balanced returned a full
  verse/chorus/outro with lines like "I searched the shadows, traced the cold outline" and "The
  ghost I chased was always in the room" — and both preserved the locked lyric line ("I never
  found the one who broke me.") verbatim, as required. `psql` confirmed the persisted
  `PromptPackage` rows recorded `model: gemini-3.5-flash`, `apiMode: interactions`, and realistic
  multi-attempt latencies (58–141 seconds, consistent with the SDK's own internal retry extending
  past a single 60s attempt).
- **Bug caught by this live test**: `wrapCompilerWithDevFallback`'s `metadata` was originally
  static — it always reported the real Gemini compiler's metadata even on calls that actually fell
  back to Mock, which would have permanently mislabeled Mock-produced content as Gemini output in
  the persisted metadata. Fixed to mutate `metadata` per-call based on which backend actually
  served that call, with new tests asserting both directions. See `docs/TROUBLESHOOTING.md`.
- Bold strategy needed the dev fallback more than once during testing (its generation apparently
  takes longer) — accepted as the fallback mechanism doing its job rather than chased further, to
  avoid burning more real API quota chasing a "perfect" 3-for-3 run when the definition-of-done
  (one real fixture compiling) was already satisfied twice over with full content verification.

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint` — pass
- `pnpm test` — 52/52 pass (all offline; `@google/genai` is mocked, no network access needed)
- `pnpm build` — pass, all routes compiled
- `pnpm prisma migrate dev` — pass, new columns confirmed via `psql \d "PromptPackage"`
- Real Gemini calls — pass (see above), with one real bug found and fixed as a direct result

### Decisions recorded

See `DECISIONS.md` ADR-028 through ADR-030.

### Known gaps carried forward

- `spec-enrichment.system.md` deferred until Stage B (Phase 4 theory engines) calls Gemini (ADR-030).
- Budget-limit policy — new pending decision, needs a product answer (per-user/global/none) before
  it can be engineered.
- Persisting metadata for *failed* compile attempts — only successes get a `PromptPackage` row
  this slice; proper failure logging needs the still-pending logging/observability provider.
- App-level rate limiting (distinct from the single-Gemini-429 handling this phase adds) — still
  pending, unchanged from Phase 0-2.
- DB hosting, deployment platform, background jobs — still pending.

---

## Phase 4 — Theory engines (first slice)

- Date: 2026-07-14
- Status: **DONE, live-verified**

### 한글 요약

- **무엇을 만들었나**: `docs/PRODUCT_SPEC.md` §6.1에 명시된 7개 작곡 이론 엔진(FormFunction, MelodyMemory,
  HarmonyGravity, RhythmMomentum, Prosody, ArrangementForm, Subtraction)을 전부 결정론적(deterministic)
  순수 함수로 구현했습니다. 오디오/MIDI 분석이 아니라 `SongDesignSpec`에 이미 있는 구조화된 텍스트/메타데이터
  (섹션 이름, 에너지 레벨, 특성 목록 등)를 검사하는 방식입니다. 컴파일 파이프라인의 Stage B(이론 보강)가
  이제 이 엔진들을 실제로 실행하며, 기존의 "그대로 통과" 스텁을 대체합니다.
- **거부(reject)와 잠금(lock)**: 새로운 저장 개념을 만들지 않고 기존 메커니즘을 재사용했습니다 — 경고
  거부는 `compositionTheory.dismissedWarnings` 배열(기존 `songDesignSpec` JSON 안에 위치, 새 DB
  마이그레이션 불필요), 필드 잠금은 이미 Phase 1부터 있던 `lockedFields`를 그대로 씁니다. 읽기 전용
  `POST /api/projects/{id}/analyze` 엔드포인트가 새로 생겼고, 실제 저장은 기존 PATCH가 그대로 담당합니다.
- **검증**: 엔진 7개 + 오케스트레이터에 대한 유닛 테스트를 새로 작성(총 99개, 이전 52개에서 증가), 그리고
  실제 실행 중인 프로젝트로 라이브 검증까지 진행했습니다 — 실제 프로젝트를 분석해서 진짜 경고 6개를 확인,
  그중 하나를 거부한 뒤 재분석해도 계속 필터링되는 것을 확인, `formNotes` 필드를 잠근 뒤 재분석해도
  덮어써지지 않는 것을 확인, 그리고 이론 엔진이 추가된 뒤에도 컴파일이 여전히 정상 작동하는 것(Mock 폴백
  포함, Phase 3의 메타데이터 정확성 수정도 그대로 잘 작동)까지 확인했습니다.
- **남은 것**: 노트 필드(예: formNotes)를 사용자가 직접 타이핑해서 편집하는 UI는 아직 없습니다(엔진이 계산한
  값을 보여주고 거부/잠금만 가능). 제안을 실제 스펙 수정으로 자동 반영하는 기능은 Phase 6(Revision Lab)의
  역할로 남겨뒀습니다.

### What shipped

- All 7 engines as pure, deterministic functions (`src/theory/*.ts`) grounded in
  `docs/METHODOLOGY.md` / `knowledge/composition_theory/...txt` — see the required-check → engine
  mapping in the approved plan (now also reflected in `DECISIONS.md` ADR-031/032).
- `runTheoryEngines()` (`src/theory/runTheoryEngines.ts`) combines all 7, filters dismissed
  warnings, preserves locked notes fields, and combines multiple engines' contributions to a
  shared notes field (e.g. `tensionReleaseNotes` from both Harmony and Rhythm engines).
- `compiler/pipeline.ts` Stage B now calls `runTheoryEngines(spec)` instead of passing
  `spec.compositionTheory` through unchanged.
- `CompositionTheorySpec.dismissedWarnings: string[]` (new field, no DB migration — lives inside
  the existing `songDesignSpec` jsonb column).
- New read-only `POST /api/projects/{id}/analyze` endpoint.
- `ProjectEditor.tsx`: "Analyze (theory check)" button, warnings grouped with severity and a
  per-warning "Dismiss" button that saves via the existing PATCH.
- 47 new unit tests (99 total, up from 52): one file per engine, an orchestrator test (dismiss
  filtering, lock preservation, shared-field combination), and an analyze-route ownership test.

### Live verification

Against the already-running Docker Postgres and dev server (same project used in Phase 2/3):

- `POST /analyze` on the real project returned 6 genuine warnings (e.g. "No harmonic traits
  declared," "Only one hook candidate has been recorded").
- Dismissed one via a PATCH (`dismissedWarnings: ["HarmonyGravityEngine:No harmonic traits declared."]`);
  re-analyze returned 5 warnings and confirmed the dismissed one stayed filtered.
- Locked `compositionTheory.formNotes` with hand-written text via `lockedFields`; re-analyze
  confirmed the text was untouched (engines still ran, just didn't overwrite that one field).
- Ran a real compile afterward to confirm Stage B's change didn't break the pipeline — it
  completed successfully (fell back to Mock on this particular call, same variability seen in
  Phase 3's bold strategy; the persisted metadata correctly said `model: mock`, confirming the
  Phase 3 metadata-correctness fix still holds).

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint` — pass
- `pnpm test` — 99/99 pass
- `pnpm build` — pass, new `/api/projects/[projectId]/analyze` route compiled
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-031 and ADR-032.

### Known gaps carried forward

- Manual editing of the 8 `compositionTheory.*Notes` text fields — not exposed in the UI this
  slice; engines always regenerate them fresh unless locked.
- Turning an accepted suggestion into an automatic spec edit — deferred to Phase 6 (Revision Lab).
- Everything already pending from Phase 0-3 (DB hosting, deployment platform, budget-limit policy,
  logging/observability, app-level rate limiting, background jobs) is still pending.

---

## Phase 5 — Advanced lyrics (first slice)

- Date: 2026-07-14
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **무엇을 만들었나**: 가사 초안 A/B/C를 생성하는 `LyricsDraftGenerator`(Mock + Gemini 둘 다)를 새로
  구현했습니다. `LyricsDesignSpec`은 Phase 1부터 이미 `mode`, `knowHowIntensity`, `selectedTechniques`/
  `excludedTechniques`, `lockedLines` 등 필요한 필드를 다 갖고 있었기 때문에, 이번 슬라이스는 스키마가
  아니라 그 필드를 실제로 읽어서 초안을 만드는 메커니즘 자체를 채웠습니다. Draft A는 기법 없이 직설적인
  버전, Draft B는 선택한 기법 하나를 얹은 버전, Draft C는 더 과감하게 여러 기법을 쓴 버전입니다. 새
  `POST /api/projects/{id}/lyrics/draft` 엔드포인트가 생성 후 `validateLyricsDraftSet()`으로 검증한
  결과만 반환합니다(저장은 하지 않음). 프로젝트 편집기에는 "Generate Drafts" 버튼, 초안별 사용된 기법
  표시, 그리고 선택 시 현재 가사와의 라인 단위 diff(`src/lib/diffLines.ts`, 새 의존성 없이 LCS로 직접
  구현)를 보여준 뒤 확인/취소하는 흐름을 추가했습니다. 적용하면 `workflowStage`가 `"draft"`로 바뀝니다.
- **결정론적 검증이 진짜 보장을 만듦**: `validateLyricsDraftSet()`이 Mock이든 Gemini든 상관없이 (1)
  잠근 가사 줄이 모든 초안에 글자 그대로 있는지, (2) 제외한 기법이 안 쓰였는지, (3) 직설/simple 모드에서
  기법이 하나도 없는지, (4) 보고된 기법이 전부 사용자가 실제로 선택한 기법 목록에 있는지(라이브 테스트로
  발견한 버그, 아래 참고) 확인합니다. 위반 시 400 에러로 명확한 이유를 반환합니다 — 프롬프트 지시만
  믿지 않고 코드로 강제한다는 이 프로젝트의 기존 원칙(Phase 3/4와 동일 패턴)을 그대로 이어갔습니다.
- **라이브 검증에서 실제 버그 발견**: 실제 Gemini 호출로 `selectedTechniques: ["공감각적 비유"]`만
  선택했는데, 응답이 `techniquesUsed: ["직관적 대조"]`처럼 사용자가 고르지 않은 기법 이름을 보고하는
  것을 확인했습니다. "선택한 기법만 추적 가능해야 한다"는 요구를 어기는 실제 버그였고,
  `validateLyricsDraftSet()`에 "보고된 기법은 반드시 `selectedTechniques`의 원문 그대로여야 한다"는
  검사를 추가하고 시스템 프롬프트에도 이 제약을 명시해 수정했습니다. 재검증 결과 이후 위반(빈 문자열을
  기법으로 보고한 사례)도 올바르게 거부되는 것을 확인했습니다.
- **직설 모드 확인**: 실제 Gemini 호출로 `mode: "direct"` 스펙에 대해 3개 초안 전부
  `techniquesUsed: []`이면서도 주제에 맞는 완성도 있는 가사가 나오는 것을 확인했습니다 — "직설/simple
  가사는 열등한 대안이 아니라 완전한 선택지"라는 CLAUDE.md 원칙이 실제로 지켜짐을 검증했습니다.
- **남은 것**: Theme/Ideation/Melody-fit/Revision을 각각의 화면으로 나누는 5단계 위저드, 그리고
  화자/시점/문화권(`culturalProfile`/`pointOfView`/`speaker`/`addressee`) 선택 UI는 아직 없습니다
  (스키마와 생성기는 이미 그 필드들을 읽지만, 입력할 폼 컨트롤이 없음) — 다음 "Phase 2 후반 UI" 작업으로
  넘어갑니다.

### What shipped

- `LyricsDraft`/`LyricsDraftSet` domain types (`src/domain/lyrics/draft.ts`, new).
- `LyricsDraftGenerator` interface (`src/lyrics/types.ts`) mirroring `PromptCompiler`'s shape.
- Mock generator (`src/lyrics/mockLyricsDraftGenerator.ts` + `src/llm/mock/lyricsDraftBuilder.ts`):
  fully deterministic — Draft A never uses a technique, B uses one from `selectedTechniques` minus
  `excludedTechniques`, C uses the rest; direct/simple mode always yields zero techniques across
  all three.
- Gemini generator (`src/lyrics/geminiLyricsDraftGenerator.ts` + new
  `src/llm/gemini/prompts/lyrics-draft.system.md`), same constructor/metadata pattern as
  `GeminiPromptCompiler`.
- `validateLyricsDraftSet()` (`src/lyrics/validateDraftSet.ts`) — the deterministic backstop
  described above.
- `src/lib/lyricsDeps.ts` — same Gemini-if-configured / dev-fallback-wrapped / Mock selection
  pattern as `compilerDeps.ts`; `wrapLyricsDraftGeneratorWithDevFallback` added to
  `src/llm/devFallback.ts` reusing the mutate-metadata-per-call fix from Phase 3.
- New `POST /api/projects/{id}/lyrics/draft` route — ownership-checked, generates + validates,
  returns `{drafts}` or 400 with validation errors.
- `src/lib/diffLines.ts` — LCS-based line diff, no new dependency.
- `ProjectEditor.tsx`: "Generate Drafts (A / B / C)" button, per-draft techniques/notes display,
  "Use this draft" → inline diff → "Confirm & Save" / "Cancel", saved via the existing PATCH with
  `lyricsDesign.workflowStage` set to `"draft"`.
- 21 new unit tests (120 total, up from 99): Mock generator, `validateLyricsDraftSet` (including
  the technique-traceability case), `diffLines`, and the new API route's ownership cases.

### Live verification

Against the already-running Docker Postgres and dev server:

- Generated drafts with Mock for the existing (direct-mode, no techniques selected) test project —
  confirmed all 3 drafts had `techniquesUsed: []`.
- Adjusted the project to a non-direct mode with one selected technique, generated again — confirmed
  the technique appeared in `techniquesUsed` for the drafts that used it and only that technique.
- Applied a draft, confirmed the diff view matched the actual line changes, confirmed save +
  `workflowStage: "draft"` persisted correctly.
- One real `POST .../lyrics/draft` call to Gemini for a `mode: "direct"` spec — confirmed 0
  techniques across all 3 drafts with genuinely different, on-theme lyrics.
- A second real Gemini call with `selectedTechniques: ["공감각적 비유"]` surfaced the
  technique-traceability bug (`techniquesUsed: ["직관적 대조"]`, never selected) — fixed and
  re-verified the fix rejects a subsequent violation correctly (see `docs/TROUBLESHOOTING.md`).

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint` — pass
- `pnpm test` — 120/120 pass
- `pnpm build` — pass, new `/api/projects/[projectId]/lyrics/draft` route compiled
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-033.

### Known gaps carried forward

- Dedicated Theme / Ideation / Melody-fit / Revision screens — deferred to the Phase 2-tail UI
  pass.
- UI for `culturalProfile`/`pointOfView`/`speaker`/`addressee`/`selectedTechniques`/
  `excludedTechniques` editing — schema and generator already support these fields; no form
  control yet.
- A dedicated repair pass for lyrics drafts — a hard-constraint violation is rejected with a clear
  error rather than auto-repaired; the main pipeline's Stage G repair pass is unrelated.
- Everything already pending from Phase 0-4 (DB hosting, deployment platform, budget-limit policy,
  logging/observability, app-level rate limiting, background jobs) is still pending.

---

## Phase 2-tail UI (first slice) — Reference/Deliberate Differences + Structure/Emotion Curve

- Date: 2026-07-14
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **무엇을 만들었나**: Phase 1부터 스키마에는 있었지만 "직접 API/JSON으로만" 편집 가능했던 두 영역에
  드디어 UI를 붙였습니다. (1) "Reference & deliberate differences" 섹션 — 참조곡 유무 토글, 곡
  제목/아티스트/참조 이유, surface traits(표면적 특징, 절대 결과물에 그대로 옮기지 않음)와 functional
  principles(기능적 원칙, 결과물에 반영 가능) 목록 추가/삭제, similarity guardrails, 그리고 의도적
  차이(dimension/fromReference/toNew) 목록 추가/삭제 — 참조곡을 설정하면 최소 3개가 필요하다는 기존
  스키마 규칙을 실시간 카운트로 보여줍니다. (2) "Structure & emotion curve" 섹션 — 구조 섹션(이름,
  극적 기능, 에너지 레벨, 길이, 노트) 추가/삭제와 Move up/down으로 순서 변경, 감정 곡선 포인트(위치,
  에너지, 텐션, 발렌스) 추가/삭제. 두 영역 모두 새 스키마나 새 API 없이 기존 PATCH 하나로 저장됩니다.
  구조의 `order` 필드는 사용자가 직접 숫자를 입력하지 않고 목록 내 위치에서 자동으로 계산합니다(입력과
  실제 순서가 어긋날 일이 없음).
- **실제 버그 발견 및 수정**: 라이브 테스트 중 저장 실패 시 에러 배너가 항상 API의 일반 메시지
  ("Invalid song design spec.")만 보여주고, 서버가 이미 함께 반환하던 구체적인 Zod 검증 메시지
  (`issues` 배열)는 그냥 버려지고 있었다는 걸 발견했습니다. 즉 참조곡을 설정하고 의도적 차이를 2개만
  넣은 뒤 저장하면 저장은 실패하지만 "왜" 실패했는지 사용자는 전혀 알 수 없었습니다 — 이번 슬라이스가
  처음으로 그 경로를 UI에서 실제로 밟아봤기 때문에 드러난 버그입니다. `handleSave`가 `issues[].message`를
  에러 배너에 이어붙이도록 수정했고, 재검증 결과 "At least 3 deliberate differences are required..."
  메시지가 실제로 화면에 뜨는 것을 확인했습니다.
- **검증**: 새 Playwright 스펙(`tests/e2e/reference-structure.spec.ts`)으로 차이 2개→저장 실패(에러
  메시지 노출 확인)→3번째 차이 추가→저장 성공→구조/감정 곡선 추가→저장→새로고침 후 값이 그대로 남아있는지
  확인까지 전부 자동화했습니다. 기존 120개 유닛 테스트와 `happy-path.spec.ts`도 영향받지 않았습니다(단,
  `happy-path.spec.ts`는 이번 작업과 무관하게 실제 Gemini 호출 지연/타임아웃으로 인한 사전 존재
  플레이키니스가 있다는 걸 `git stash`로 원래 코드 기준에서도 재현해 확인했습니다 — 아래 트러블슈팅 참고).
- **남은 것**: Theme/Ideation/Melody-fit/Revision 전용 화면, 화자/시점/문화권 선택 UI(Phase 5에서 이미
  보류), `contrastPlan`/`hookPlan`/`repetitionPlan` 편집 UI, `compositionTheory.*Notes` 필드 잠금
  버튼(Phase 4에서 이미 보류)은 여전히 없습니다. 전체 8/14단계 위저드(PRODUCT_SPEC §16)도 이번에도
  시작하지 않고 기존 단일 페이지를 계속 확장하는 쪽을 택했습니다(ADR-024 연장, ADR-034).

### What shipped

- `ProjectEditor.tsx`: new "Reference & deliberate differences" section (reference toggle,
  songTitle/artistName/userReason, surfaceTraits/functionalPrinciples/similarityGuardrails rows,
  deliberateDifferences rows with a live `{count} / {MINIMUM_DELIBERATE_DIFFERENCES}` hint) and new
  "Structure & emotion curve" section (structure rows with Move up/down, emotionCurve rows).
- `buildSpecFromForm` extended to assemble `reference`/`deliberateDifferences`/`structure`/
  `emotionCurve` — no new schema, no new API route; the existing `PATCH /api/projects/{id}` and its
  Zod validation already supported all of this since Phase 1.
- New `tests/e2e/reference-structure.spec.ts`.
- `playwright.config.ts`: bumped the default `expect` timeout from 5000ms to 15000ms — compile
  round-trips (real Gemini or its dev-fallback to Mock) vary from ~1s to 17s+, and the old default
  was too tight (see Troubleshooting).

### Live verification

Against the already-running Docker Postgres and dev server:

- Toggled a reference on, filled required fields, added exactly 2 deliberate differences, saved —
  confirmed the save failed and the specific message ("At least 3 deliberate differences are
  required when a reference is set.") appeared in the error banner for the first time.
- Added a 3rd difference, saved — confirmed success (no error banner).
- Added a structure section and an emotion-curve point, saved, reloaded the page — confirmed every
  field's value round-tripped through Postgres correctly.
- Re-ran Analyze after adding real (non-empty) structure data — confirmed it runs cleanly with no
  crash (previously only ever exercised against `structure: []`); this particular structure content
  didn't happen to change the specific warning count (6 before, 6 after) — the engines check
  specific conditions (e.g. final-chorus escalation, pre-chorus purpose) that two generically-named
  sections don't necessarily satisfy or violate.
- Confirmed via `git stash` that `happy-path.spec.ts`'s intermittent compile-step failure
  reproduces identically on the pre-existing, unmodified codebase — not a regression from this
  slice (see Troubleshooting).

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint` — pass
- `pnpm test` — 120/120 pass (unchanged — no new pure logic needed a unit test)
- `pnpm build` — pass
- `pnpm exec playwright test tests/e2e/reference-structure.spec.ts` — pass
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-034.

### Known gaps carried forward

- The full 8/14-screen wizard (`docs/PRODUCT_SPEC.md` §16) — still one dense page (ADR-024 stands).
- `contrastPlan` / `hookPlan` / `repetitionPlan` UI — not exposed yet, still API/JSON-only.
- Phase 5's already-deferred items (Theme/Ideation/Melody-fit/Revision screens,
  `culturalProfile`/`pointOfView`/`speaker`/`addressee` UI) — untouched by this slice.
- Phase 4's already-deferred lock-field UI for `compositionTheory.*Notes` — still only Dismiss
  exists client-side.
- `happy-path.spec.ts`'s real-Gemini-latency flake — pre-existing, confirmed unrelated to this
  slice; not fixed here (see Troubleshooting for what was and wasn't addressed).
- Everything already pending from Phase 0-5 (DB hosting, deployment platform, budget-limit policy,
  logging/observability, app-level rate limiting, background jobs) is still pending.

---

## Phase 7 (first slice) — Dark immersive hero + scroll-reveal section + final CTA

- Date: 2026-07-14
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **무엇을 만들었나**: 그동안 자리만 잡아두었던 메인 페이지(`/`)에 실제 랜딩 페이지를 만들었습니다.
  사용자가 https://www.nypc.co.kr/main/main.do 를 보여주며 "이 페이지와 똑같은 구조로, 스크롤하면
  설명이 나오는 것까지" 만들어달라고 요청했는데, `IMPLEMENTATION_PLAN.md` Phase 7에는 이미 NYPC를
  참고 후보로 언급하면서 "에셋 그대로 복사 금지 / 레이아웃 그대로 복사 금지"라는 가드레일이 있었습니다.
  조용히 무시하지 않고 사용자에게 이 충돌을 알린 뒤, "레이아웃/구조는 최대한 동일하게" 하기로 명시적
  확인을 받고 진행했습니다(ADR-035에 예외로 기록). 실제 NYPC 페이지와 CSS 파일들을 직접 받아서 분석한
  결과, 실제 구조는 카드 그리드가 아니라 "검은 배경, 전체 화면 2개 섹션, 하단 고정 CTA 버튼 + 스크롤
  힌트 화살표"로 이루어진 티저 페이지였습니다. 이 구조(비율, 폰트 크기, 여백, 인터랙션 방식)는 최대한
  그대로 옮겼지만, NYPC의 실제 브랜드명/카피/영상·이미지 에셋/유료 라이선스 폰트(poster-gothic-cond-atf,
  Adobe Typekit 유료 폰트)는 전혀 재사용하지 않았습니다 — 색상은 프로젝트 기존 다크 테마 토큰을, 카피는
  Music Prompt Architect의 실제 제품 내용(Safe/Balanced/Bold, 7개 이론 엔진)을 그대로 사용했습니다.
- **실제 버그 발견 및 수정**: 스크린샷으로 확인하던 중, 하단에 고정된 CTA 버튼 바가 두 번째 섹션의
  마지막 설명 항목 텍스트를 가리는 것을 발견했습니다 — 알고 보니 NYPC의 실제 CSS에도 정확히 이 문제를
  피하기 위한 `padding-bottom: 160px`이 있었는데, 이 부분을 포팅하면서 빠뜨렸던 것이었습니다. 동일한
  하단 여백을 추가해서 수정하고 스크린샷으로 재확인했습니다.
- **검증**: 스크린샷 3장(히어로, 스크롤 후 설명 섹션, 모바일 375px 너비)으로 실제 레이아웃을 눈으로
  확인했고, `prefers-reduced-motion`이 스크롤 힌트 애니메이션을 실제로 멈추는지, 모바일 너비에서 가로
  스크롤이 생기지 않는지, Sign up/Log in 버튼이 실제로 `/signup`/`/login`으로 이동하는지까지 새
  Playwright 스펙(`tests/e2e/landing.spec.ts`)으로 자동화했습니다.
- **남은 것**: Phase 7의 나머지 항목(Sound Seed Orb, 실시간 변환 데모, 방법론 스토리, Provider 선택기,
  Composition/Lyrics Lab 미리보기, App 섹션, Lighthouse 측정)은 이번 슬라이스에 포함되지 않았습니다.
  이번에 받은 "레이아웃 그대로" 예외는 이번 슬라이스에만 적용되며, 나머지 Phase 7 항목은 원래 계획대로
  NYPC와 다르게 만들 수 있습니다.

### What shipped

- `src/app/page.tsx` — rewritten as a two-section landing page (dark full-viewport hero with
  centered headline/description; a second full-viewport section with a static mocked
  prompt-package-preview card + a divided two-item description list).
- `src/app/page.module.css` — new layout matching the measured structural values from NYPC's
  `teaser.css` (hero `dt`-equivalent 42px/700 desktop → ~28px mobile, section-2 heading 20px with
  a divider before the second item, 48px/24px-radius pill CTA buttons, the same `translateY` bounce
  keyframe for the scroll hint), using this project's own color tokens/fonts, with responsive
  breakpoints at 1261/1024/640px.
- `src/app/ScrollHint.tsx` (new) — small client component toggling a fade-out state once
  `window.scrollY > 8`, reimplemented fresh (not copied JS) to match the same interaction pattern.
- New `tests/e2e/landing.spec.ts` — Sign up/Log in navigation, `prefers-reduced-motion` behavior.

### Live verification

Against the already-running dev server:

- Took and reviewed screenshots at desktop width (hero, and after scrolling to the second section)
  and at 375px mobile width — this is what caught the CTA-bar/description-text overlap bug (fixed,
  re-screenshotted, confirmed fixed).
- Confirmed no horizontal overflow at 375px width via `document.documentElement.scrollWidth` vs.
  `clientWidth`.
- Confirmed the scroll-hint fades (`data-scrolled="true"`) after scrolling, and that
  `prefers-reduced-motion: reduce` collapses its animation duration to effectively zero.
- Confirmed Sign up/Log in links navigate to `/signup`/`/login` correctly.

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass
- `pnpm test` — 120/120 pass (unchanged)
- `pnpm exec playwright test tests/e2e/landing.spec.ts` — pass
- Full Playwright suite — 3/4 pass; the 1 failure is the pre-existing, already-documented
  `happy-path.spec.ts` Gemini-latency flake, unrelated to this slice.

### Decisions recorded

See `DECISIONS.md` ADR-035 (guardrail override, what was/wasn't reused, the padding-bug fix).

### Known gaps carried forward

- The rest of Phase 7: Sound Seed Orb, live transformation demo, methodology story, provider
  selector, Composition/Lyrics Lab preview, app section, Lighthouse baseline.
- Keyboard navigation wasn't explicitly checked this slice (Sign up/Log in are plain `<Link>`s, so
  likely fine, but not verified).
- Everything already pending from Phase 0-5 + Phase 2-tail (DB hosting, deployment platform,
  budget-limit policy, logging/observability, app-level rate limiting, background jobs,
  `happy-path.spec.ts`'s Gemini-latency flake) is still pending.

---

## Phase 7 (second slice) — Animated hero background art + anonymous no-login demo

- Date: 2026-07-14
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **배경 이미지**: 사용자가 처음에 베토벤/밥 딜런/비틀즈/마이클 잭슨/BTS/퀸의 사진을 히어로 배경에
  넣어달라고 요청했는데, 베토벤을 제외한 나머지는 전부 실제 법적 위험(생존 인물의 초상권, 사후에도
  적극적으로 관리되는 이미지권, 그리고 거의 모든 사진 자체의 저작권)이 있다는 걸 먼저 설명드렸습니다.
  사용자가 처음엔 "베토벤만", 나중엔 "적절히 음악적이고 예술적인 이미지"로 범위를 좁혀주셔서, 베토벤
  초상화 2점(Stieler 1820년작, Mähler 1804-05년작)을 Wikimedia Commons에서 실제로 퍼블릭 도메인
  라이선스 태그까지 확인하고 `curl`로 실제 이미지 응답까지 검증한 뒤 자체 서버에 다운로드해서 썼습니다
  (ADR-036). 8초마다 서서히 두 그림이 전환되며 천천히 확대/이동하는 느낌(Ken Burns 효과)을 주고,
  텍스트 가독성을 위해 어두운 그라데이션을 씌웠습니다.
- **로그인 없이 바로 써보는 데모**: 사용자가 "로그인/회원가입을 없애고 스크롤하면 바로 기능을 쓸 수
  있게 하자"고 하셨는데, 이건 `CLAUDE.md`의 MVP 요구사항(기본 인증과 프로젝트 소유권)과 Phase 2에서
  이미 검증한 "다른 사용자는 접근할 수 없다"는 보장을 직접 무효화하는 큰 변경이라 조용히 진행하지 않고
  먼저 여쭤봤습니다. 사용자가 확인해주신 방향은 "기존 계정 체계는 그대로 두고, 로그인 없이 바로 써볼
  수 있는 별도의 데모를 추가"하는 것이었습니다. 이 데모(`/api/demo/compile`)는 아직 요청 속도 제한
  (rate limiting) 인프라가 없는 상태에서 익명 사용자가 실제 과금되는 Gemini를 호출할 수 있게 되는 걸
  막기 위해, 아예 `compilerDeps.ts`의 공용 Gemini/Mock 선택 로직을 쓰지 않고 Mock 컴파일러만 직접
  생성해서 씁니다 — "주석으로 조심하자"가 아니라 "애초에 코드 구조상 Gemini에 닿을 수 없게" 만든
  것입니다. 인증 체크나 DB 저장도 전혀 하지 않습니다.
- **실제로 발견한 버그**: 처음 버전은 사용자의 아이디어를 `northStar.audienceExperience`에만 넣었는데,
  Mock 컴파일러의 `fields.lyrics`는 `lyricsDesign.originalLyrics`에서만 값을 가져오는 걸 뒤늦게
  확인했습니다 — 그래서 데모 결과의 "Lyrics" 필드가 항상 비어 있었습니다. `originalLyrics`에도 같은
  아이디어를 넣어서 수정했습니다.
- **검증**: 스크린샷(데스크톱 히어로, 스크롤 후 데모 결과, 모바일 375px)으로 눈으로 확인했고, 새
  Playwright 테스트로 "세션 쿠키가 전혀 없는 상태에서" 데모가 실제로 동작하는 것, 그리고
  `prefers-reduced-motion`이 스크롤 힌트뿐 아니라 히어로 배경 애니메이션까지 멈추는 것을 확인했습니다.

### What shipped

- `src/app/HeroBackground.tsx` (new) — cross-fades between two self-hosted, verified-public-domain
  Beethoven portraits every ~8s with a CSS Ken Burns zoom/pan; JS interval is skipped entirely
  under `prefers-reduced-motion: reduce` (not just sped up), and the CSS animation/transition
  durations are additionally covered by the existing global reduced-motion rule.
- `public/images/hero/beethoven-{stieler-1820,mahler-1805}.jpg` (new, self-hosted).
- `src/app/api/demo/compile/route.ts` (new) — anonymous `POST`, Zod-validated `{ idea }` (max 2000
  chars), Mock-only by construction (see ADR-036), no auth import, no persistence.
- `src/app/DemoForm.tsx` (new) — replaces the static mocked JSON preview card in the scroll-reveal
  section with a real textarea → Generate → result flow, plus a "Sign up to unlock real Gemini +
  Safe/Balanced/Bold" upsell line.
- `src/app/page.tsx`/`page.module.css` updated to wire both in; existing account system
  (`/login`, `/signup`, ownership checks) completely untouched.
- 3 new unit tests (123 total, up from 120) for the demo route (validation, success shape, and
  asserting `auth()`/`prisma.promptPackage.createMany` are never called).
- `tests/e2e/landing.spec.ts` extended: a no-login demo-generation case, and the
  `prefers-reduced-motion` case now also checks the hero background's animation duration (added
  `data-testid`s to disambiguate from the pre-existing scroll-hint check, which broke once a
  second `aria-hidden` element existed on the page).

### Live verification

Against the already-running dev server:

- Screenshots at desktop width (hero with visible portrait + readable text, and the scroll-reveal
  section after generating a demo result) and 375px mobile width — all reviewed, no overlap or
  overflow issues found this time.
- Confirmed via Playwright that the demo works with zero cookies matching `/session/i` present,
  and that the flow never redirects to `/login`.
- Confirmed `prefers-reduced-motion: reduce` collapses both the scroll-hint's and the active hero
  image layer's animation duration to effectively zero.

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass
- `pnpm test` — 123/123 pass (up from 120)
- `pnpm exec playwright test tests/e2e/landing.spec.ts` — 3/3 pass
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-036 (Mock-only demo boundary, image sourcing, the lyrics-field bug fix).

### Known gaps carried forward

- Real rate limiting is still needed before any anonymous path could ever be allowed to call real
  Gemini — the demo stays Mock-only until then, by design, not as a temporary shortcut.
- The rest of Phase 7 (methodology story, provider selector, Lab preview, app section, Lighthouse
  baseline) is still open.

---

## Phase 7 (third slice) — 5-section landing page restructure

- Date: 2026-07-14
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **무엇을 했나**: 사용자가 (Claude Code로 랜딩 페이지 만드는) 유튜브 영상을 본 뒤 스스로 요약해 만든
  프롬프트 템플릿을 공유하면서, 그 방식을 우리 실제 랜딩 페이지에 적용해달라고 요청했습니다 — Hero/
  Problem/Service/Testimonial/CTA 5개 섹션 구조, 디자인 시스템, 그리고 구체적인 숫자와 상황이 담긴
  카피라이팅. 다만 템플릿을 그대로 따르지 않고 두 가지를 의도적으로 다르게 처리했습니다.
- **가짜 수치를 넣지 않음**: 템플릿의 예시 숫자("효율 40% 절감", "하루 127건", "주 12시간")는 일반적인
  B2B SaaS 템플릿의 placeholder였지 우리 제품의 실측치가 아니었습니다. 대신 실제로 검증 가능한 사실
  (7개 이론 엔진, Safe/Balanced/Bold 3개 병렬 전략, 가사 A/B/C 초안 + 잠긴 줄 보존)을 성과 중심 문장으로
  풀어썼습니다.
- **가짜 후기를 만들지 않음**: 템플릿은 "구체적인 경험담" 형태의 고객 후기 섹션을 요구했지만, 이 제품은
  실제 사용자가 아직 없습니다. 이름 붙은 가짜 후기를 실제 것처럼 올리는 건 스타일 선택이 아니라 명백한
  기만이라 판단해서, 그 자리를 "Built on real songwriting craft" 섹션으로 대체했습니다 — 실제
  `docs/METHODOLOGY.md`/`CLAUDE.md`에 있는 원칙 3가지(레퍼런스는 표면이 아니라 원리만 추출 + 3개
  차이 필수, 직설 가사는 완전한 선택지, 잠근 줄은 모든 리비전에서 보존)를 "왜 이렇게 만들었는가"로
  보여주는 카드 3개입니다. 부제도 정직하게 "마케팅 문구가 아니라 코드로 강제되는 규칙"이라고 적었습니다.
- **Tailwind 대신 기존 CSS Modules 유지**: 템플릿은 Tailwind를 지정했지만, 이 프로젝트엔 Tailwind가
  없었고 기존 CSS Modules + 토큰 체계로 이미 히어로/데모 페이지가 잘 동작하고 있었습니다. 페이지 하나
  때문에 두 번째 스타일링 체계를 들이거나 전체를 마이그레이션할 이유가 없어서 CSS Modules를 그대로
  확장했습니다. "예술적인 색상"은 기존 보라/청록에 크림슨/골드 토큰을 추가하는 식으로 구현했습니다.
- **레이아웃/구조는 전적으로 위임받음**: 사용자가 "레이아웃은 너가 알아서, 애니메이션은 영상 요약
  참고"라고 했는데, 실제로 공유된 텍스트에는 구체적인 애니메이션 기법이 없어서, 스크롤에 따라 각 섹션이
  서서히 나타나는(fade + slide-up) 표준적인 랜딩 페이지 패턴을 적용했습니다(`Reveal.tsx`,
  `IntersectionObserver` 기반, reduced-motion 시 애니메이션 없이 바로 보이도록 처리).
- **실제로 발견한 레이아웃 버그**: 첫 스크린샷에서 히어로의 `position: fixed` CTA 바(Sign up/Log in
  버튼)가 새로 추가된 Problem 섹션의 텍스트를 그대로 덮고 있는 게 보였습니다 — 섹션이 2개였을 때는
  "항상 떠 있는 버튼 바"가 자연스러웠지만, 5개 섹션이 생기면서 그 아래 모든 섹션을 계속 가리는 버그가
  된 것이었습니다. `.ctaBar`를 `position: absolute`(히어로 섹션 기준)로 바꿔서 히어로와 함께 자연스럽게
  스크롤되어 사라지도록 수정했습니다.

### What shipped

- `src/app/page.tsx` — thin composition of 5 new section components.
- `src/app/Hero.tsx`/`Hero.module.css` (extracted from the old monolithic `page.tsx`) — headline
  sharpened to contrast "Suno vs. Udio, described differently" against "one spec, matched output
  for both"; `.ctaBar` changed from page-wide `position: fixed` to `position: absolute` scoped to
  `.hero` (the real bug fix above).
- `src/app/Problem.tsx`/`.module.css` (new) — "without a shared spec" vs. "with Music Prompt
  Architect" two-column contrast, grounded in real friction (provider-specific prompt shaping,
  interacting spec fields, lyric lines lost on revision).
- `src/app/Service.tsx`/`.module.css` — restructures the former `dt`/`dd` feature list into 3
  outcome-framed cards (Safe/Balanced/Bold, the 7 theory engines, A/B/C lyric drafts).
- `src/app/Craft.tsx`/`.module.css` (new) — replaces the template's Testimonial slot with 3 cards
  on real methodology principles; see the 한글 요약 above for why.
- `src/app/CTA.tsx`/`.module.css` (new) — wraps the existing, unchanged `DemoForm`.
- `src/app/Reveal.tsx` (new) — shared `IntersectionObserver`-based scroll-reveal, reduced-motion
  aware via a lazy `useState` initializer (not a synchronous `setState` in `useEffect`, which this
  project's `react-hooks/set-state-in-effect` lint rule correctly flags).
- `src/app/globals.css` — two new tokens, `--color-accent-crimson`/`--color-accent-gold`.
- `tests/e2e/landing.spec.ts` — new case asserting all 5 section headings render.

### Live verification

Against the already-running dev server:

- Screenshots of all 5 sections at desktop width and 3 at 375px mobile width — the first pass
  caught the CTA-bar overlap bug described above; a second pass after the fix confirmed every
  section renders cleanly with no overlap, at both widths.
- Confirmed no horizontal overflow at 375px width scrolled all the way through the page.
- Existing Playwright cases (no-login demo, reduced-motion, Sign up/Log in navigation) all still
  pass unchanged, since `DemoForm`/`HeroBackground`/`ScrollHint` themselves weren't rewritten, only
  relocated into the new section components.

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint` — pass (lint caught the `set-state-in-effect` issue in `Reveal.tsx`
  on first pass; fixed before this was "done")
- `pnpm build` — pass
- `pnpm test` — 123/123 pass (unchanged — no new pure logic needed a unit test)
- `pnpm exec playwright test tests/e2e/landing.spec.ts` — 4/4 pass
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-037 (5-section restructure, no fabricated stats/testimonials, CSS Modules
over Tailwind, the fixed-CTA-bar bug).

### Known gaps carried forward

- The rest of Phase 7 (Sound Seed Orb, provider selector, Lab preview, app section, Lighthouse
  baseline) is still open.
- Keyboard navigation through the 5 sections wasn't explicitly re-checked this slice.
- Everything already pending from Phase 0-5 + Phase 2-tail + Phase 7 first/second slice is still
  pending.

---

## Phase 7 (fourth slice) — No-login demo moved above the fold

- Date: 2026-07-15
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **무엇을 했나**: 사용자가 "실제로 프롬프트 적는 부분을 접속하자마자 보이는 화면에 넣고, 밑부분은
  설명을 나열하는 식으로 하자"고 요청했습니다. 그동안 데모(`DemoForm`)는 페이지 맨 아래, 스크롤을 다
  내려야 나오는 별도의 CTA 섹션에 있었는데, 이번엔 아예 히어로 섹션 안으로 옮겨서 접속하자마자(스크롤
  없이) 바로 아이디어를 입력하고 "Generate"를 누를 수 있게 만들었습니다. 기존에 히어로에 있던 "Sign
  up/Log in" 큰 알약 버튼은 이제 데모의 "Generate" 버튼이 주(主) 행동이 되었으므로, 그보다 눈에 덜
  띄는 작은 텍스트 링크로 바꿨습니다. 아래에 있던 별도의 CTA 섹션(`CTA.tsx`)은 데모를 중복으로 갖고
  있을 이유가 없어져서 통째로 삭제했습니다.
- **레이아웃 방식도 함께 개선**: 기존 히어로는 `height: 100vh` + 텍스트를 화면 하단에 절대좌표로
  고정 + 별도로 떠 있는 CTA 바 조합이었는데, 이번에 `min-height: 100vh` + 일반적인 flexbox 중앙
  정렬로 바꿨습니다. 이러면 데모 폼처럼 "결과가 나오기 전/후로 높이가 달라지는" 콘텐츠를 넣어도 화면
  깨짐 없이 자연스럽게 적응합니다(이전 방식은 콘텐츠 높이가 고정적이라고 가정하고 화면 크기별로
  `margin-bottom` 값을 일일이 맞춰야 했음).
- **실제로 확인한 것**: 1280×720, 1440×900(일반적인 노트북 화면), 375×812(모바일) 전부에서 헤드라인
  + 설명 + 데모 폼 + 로그인 링크 + 스크롤 힌트까지 한 화면 안에 다 들어가는 것을 스크린샷으로
  확인했습니다 — "말만 그렇다"가 아니라 실제로 스크롤 없이 보인다는 걸 검증했습니다.
- **테스트도 같이 수정**: 이제 사라진 "Try it right now" 섹션을 확인하던 테스트를 지우고, "스크롤
  없이 데모가 보이는지" 확인하는 테스트를 새로 추가했습니다. 또 기존 테스트의
  `getByText(/Sign up/).last()` 부분이 이제 같은 섹션 안에 "Sign up"이 두 번(인증 링크, 데모 결과
  안내 문구) 나오면서 애매해질 수 있어서, 더 구체적인 문구로 바꿨습니다.

### What shipped

- `src/app/Hero.tsx` — now renders `DemoForm` directly below the headline/description, with small
  underlined Sign up/Log in text links and `ScrollHint` below that.
- `src/app/Hero.module.css` — `.hero` changed from `height: 100vh` + absolutely-positioned
  bottom-anchored `.heroContent` + a separately-`position: absolute` `.ctaBar`, to `min-height: 100vh`
  with `.heroContent` as a normal-flow flex column, centered via the section's own
  `align-items`/`justify-content`. `DemoForm`'s styles (`.demoForm`, `.demoTextarea`, etc.) moved
  here from the deleted `CTA.module.css`.
- `src/app/DemoForm.tsx` — import path updated to `./Hero.module.css` (component itself unchanged).
- `src/app/CTA.tsx` / `src/app/CTA.module.css` — deleted (redundant now that `DemoForm` lives in
  Hero).
- `src/app/page.tsx` — now a 4-section composition: Hero(+demo)/Problem/Service/Craft.
- `tests/e2e/landing.spec.ts` — removed the "Try it right now" heading case; added
  "the no-login demo is visible without scrolling"; fixed the post-generate assertion to target the
  specific upsell sentence instead of an now-ambiguous `getByText(/Sign up/).last()`.

### Live verification

Against the already-running dev server (Docker Postgres was not running this session — not needed,
since neither the landing page nor the Mock-only demo touch the database):

- Screenshots at 1280×720, 1440×900, and 375×812 confirmed the entire hero (headline, description,
  demo form, auth links, scroll hint) fits within one viewport at every size, with the scroll-hint
  chevron visible confirming there's still more to scroll to below.
- Screenshots of the Problem/Craft sections below the fold confirmed no overlap or regressions from
  the layout change.
- Confirmed no horizontal overflow at 375px width after scrolling the full page.
- All 5 Playwright cases in `landing.spec.ts` pass, including the new above-the-fold case.

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass
- `pnpm test` — 123/123 pass (unchanged)
- `pnpm exec playwright test tests/e2e/landing.spec.ts` — 5/5 pass
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-038.

### Known gaps carried forward

- The rest of Phase 7 (Sound Seed Orb, provider selector, Lab preview, app section, Lighthouse
  baseline) is still open.
- Everything already pending from Phase 0-5 + Phase 2-tail + Phase 7 first/second/third slice is
  still pending.

---

## Phase 7 (fifth slice) — Auth pages restyled + compile history + livelier explanation sections

- Date: 2026-07-15
- Status: **DONE (first-slice scope), live-verified**

### 한글 요약

- **로그인/회원가입 리디자인**: "Sign up/Log in 페이지 없어도 된다지만 그래도 메인이랑 똑같이 세련되게
  만들자"는 요청에 맞춰, 기존에 완전히 기본 스타일(라이트 테마, 인라인 스타일)이던 `/login`·`/signup`
  페이지를 메인 페이지와 같은 다크 테마 + 베토벤 배경 아트 + 크림슨/골드 그라데이션 버튼으로 다시
  만들었습니다. 새 공유 CSS 모듈(`AuthForm.module.css`) 하나로 두 페이지가 같은 디자인을 씁니다.
- **"대화내역" 대신 "컴파일 이력"**: 사용자가 "로그인하면 챗GPT/제미나이처럼 대화내역을 볼 수 있게
  해달라"고 했는데, 이 앱은 대화형 구조가 아니라 프로젝트(설계도) 구조라서 말 그대로의 "대화내역"은
  없습니다. 대신 코드를 확인해서 실제로 이미 존재하는 이력 데이터 두 가지를 찾았습니다 — 저장할
  때마다 쌓이는 `ProjectVersion`(설계도 스냅샷)과 컴파일할 때마다 쌓이는 `PromptPackage`(과거
  Safe/Balanced/Bold 결과) — 둘 다 이미 DB에 저장되지만 화면에는 최신 것만 보여주고 있었습니다. 이
  사실과 두 대안을 사용자에게 그대로 보여드리고 고르게 했고, **"과거 컴파일 결과 이력"을 선택**받아
  구현했습니다(프로젝트 버전 이력은 이번에 만들지 않았지만, 마찬가지로 데이터는 이미 있어서 나중에
  추가하기 쉽습니다).
- **설명 섹션을 더 "톡톡 튀게"**: 사용자가 "Problem/Service/Craft 섹션이 설명은 좋은데 음악 프롬프트
  만드는 사이트답게 좀 더 톡톡 튀는 느낌으로 만들자"고 요청했습니다. 카드들이 한 번에 다 나타나지 않고
  순서대로 통통 튀듯 나타나게(`Reveal`에 `delayMs` 추가, 통통 튀는 이징 곡선 적용), 카드마다 다른
  포인트 색(기존 보라/청록/핑크/크림슨/골드 토큰을 순환)과 호버 시 살짝 뜨는 효과를 추가했습니다.
- **새로운 사실 기반 카드 추가**: "탑 음대 논문과 음악계 거장들의 방법론을 AI에게 체득시켰다는 식의
  설명도 넣자"는 요청에 대해, 실제로 지어낸 이야기가 아니라 **진짜로 문서에 있는 사실**만 확인하고
  썼습니다 — `knowledge/composition_theory/top_music_school_general_composition.txt`가 실제로
  Berklee, USC Thornton, NYU Steinhardt, Juilliard의 커리큘럼과 학술 자료를 근거로 한다고 명시하고
  있고, `docs/METHODOLOGY.md`가 실제로 작사가 김이나와 K-pop 작사팀의 실무 관행(복수 초안 비교,
  데모 피팅)을 이름까지 명시하며 인용하고 있습니다. 즉 이미 있는 7개 이론 엔진과 가사 기법 메뉴가
  실제로 이 출처들을 구현한 것이라는 사실을 근거로 카드를 만들었습니다 — Phase 7 1차에서 거부했던
  "가짜 통계/후기"와는 다르게, 이번엔 진짜로 검증된 사실입니다.

### What shipped

- `src/app/AuthForm.module.css` (new, shared) + restyled `src/app/login/page.tsx`,
  `src/app/signup/page.tsx`.
- `src/app/api/projects/[projectId]/history/route.ts` (new) — ownership-checked `GET`, up to 50
  most recent `PromptPackage` rows, newest first, `style`/`lyrics` extracted from `fields`.
- `src/app/projects/[id]/ProjectEditor.tsx` — new "View history" button + expandable History list.
- `src/app/Reveal.tsx` — new optional `delayMs` prop for staggered entrance.
- `src/app/globals.css` — `.reveal` transition changed to a back-out/bounce easing.
- `src/app/Problem.tsx`/`Service.tsx`/`Craft.tsx` — staggered per-card reveals, per-card accent
  colors + hover lift/glow, gradient-text headline accent, and a new 4th Craft card (grounded in
  real cited sources, see 한글 요약).
- `tests/unit/apiProjectHistoryRoute.test.ts` (new) — 127 unit tests total (up from 123).

### Live verification

- Screenshots of the redesigned Problem/Service/Craft sections and the restyled login page —
  reviewed, colors/motion/layout all rendering as intended.
- Full end-to-end history flow (signup → create project → save → compile → View history → expand
  an entry) verified by temporarily running a second dev-server pass with
  `GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE` blanked to force the existing Mock path
  (`isGeminiConfigured()`) for a fast, deterministic compile — the real-Gemini path hit the same
  pre-existing latency flake already documented (one attempt took a full 40s), which is unrelated
  to this feature. Dev server was restored with real keys afterward.
- Docker Desktop was not running at the start of this slice (idle overnight) and was started,
  waited on, then `docker compose up`/`prisma migrate deploy` run before this slice's live
  verification, since the history feature genuinely needs a real database (unlike the previous
  slice).

### Verification at time of this entry

- `pnpm typecheck`, `pnpm lint`, `pnpm build` — pass
- `pnpm test` — 127/127 pass (up from 123)
- `pnpm exec playwright test tests/e2e/landing.spec.ts` — 5/5 pass
- Live walkthrough — pass (see above)

### Decisions recorded

See `DECISIONS.md` ADR-039 (auth restyle + compile history) and ADR-040 (livelier sections + the
new sourced Craft card).

### Known gaps carried forward

- Project-version history (the "diff over time" alternative not chosen this round) — the
  underlying `ProjectVersion` data already exists; no UI reads it back yet.
- The rest of Phase 7 (Sound Seed Orb, provider selector, Lab preview, app section, Lighthouse
  baseline) is still open.
- Everything already pending from Phase 0-5 + Phase 2-tail + Phase 7 first-fourth slices is still
  pending.

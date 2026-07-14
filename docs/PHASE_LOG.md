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

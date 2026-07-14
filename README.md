# Music Prompt Architect

음악 생성 AI가 더 좋은 곡을 뽑아낼 수 있도록, 사용자의 음악적 아이디어를 여러 음악 생성 AI에 맞는 프롬프트로 변환해주는
웹/앱 프로젝트입니다. 이 저장소는 음악을 직접 생성하지 않습니다 — 곡의 설계(`SongDesignSpec`)를 만들고,
작곡·작사 이론을 적용하고, Provider별 Prompt Package(Safe / Balanced / Bold)로 컴파일하는 것이 목적입니다.

## 문서

- 제품 요구사항: [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md)
- 작곡·작사 방법론: [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md)
- 시스템 아키텍처 (파이프라인 다이어그램, 모듈 맵, ERD): [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 구현 계획 및 Phase 상태: [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)
- 아키텍처 결정 기록(ADR): [`DECISIONS.md`](DECISIONS.md)
- Phase 완료 이력: [`docs/PHASE_LOG.md`](docs/PHASE_LOG.md)
- 기술 이슈·트러블슈팅 기록: [`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md)
- Claude Code 작업 지침: [`CLAUDE.md`](CLAUDE.md)

## 현재 상태

**Phase 0–5 + Phase 2 후반 UI(1차) + Phase 7(1~3차) 완료, 전부 라이브 검증까지 마침.** `SongDesignSpec` Zod 스키마,
Generic/Suno/Udio Provider Registry, Auth.js 이메일/비밀번호 인증, Prisma/Postgres 영속성, 프로젝트
CRUD·컴파일·내보내기 API, 단일 페이지 프로젝트 편집기, `@google/genai`(Interactions API)를 통한 실제
Gemini 구조화 출력 컴파일러(개발 환경에서는 실패 시 Mock으로 자동 폴백), 7개 작곡 이론 엔진(FormFunction/
MelodyMemory/HarmonyGravity/RhythmMomentum/Prosody/ArrangementForm/Subtraction), 가사 초안 A/B/C
생성기(`LyricsDraftGenerator`, Mock+Gemini), 그리고 참조곡·의도적 차이·구조·감정 곡선 편집 UI가 구현되어
있습니다 — 이론 엔진이 만든 제안은 프로젝트 페이지의 "Analyze" 버튼으로 확인하고, 개별 제안을 거부
(dismiss)하거나 특정 항목을 잠글(lock) 수 있으며, "Generate Drafts" 버튼으로 초안 3개를 받아 라인 단위
diff를 확인한 뒤 적용할 수 있습니다. 참조곡을 등록하면 최소 3개의 의도적 차이가 필요하다는 기존 스키마
검증이 이제 UI에서 실제로 보이며, 구조(섹션)와 감정 곡선도 추가/삭제/순서 변경(Move up/down)이 가능하고
저장 후 새로고침해도 그대로 유지됩니다. 직설/simple 모드는 어떤 기법도 쓰지 않고, 선택한 기법만 초안에
나타나며(사용자가 고르지 않은 기법을 모델이 보고하면 검증 단계에서 거부), 잠근 가사 줄은 모든 초안에
그대로 보존됩니다(`validateLyricsDraftSet`). 회원가입→프로젝트 생성→저장→컴파일→내보내기, 다른 사용자
접근 차단, Playwright happy-path, 실제 Gemini API 호출로 Safe/Balanced/Bold 컴파일, 이론 엔진 분석→제안
거부→재분석, 실제 Gemini 호출로 가사 초안 생성(직설 모드 기법 0개 확인, 기법 추적성 버그 발견 및 수정),
그리고 참조·구조·감정 곡선 편집(차이 3개 미만 저장 시 에러 노출 확인, 저장/새로고침 영속성 확인)까지
전부 실제로 실행해 확인했습니다(`docs/PHASE_LOG.md` Phase 2/3/4/5 및 Phase 2-tail "Live verification"
참고). 메인 페이지(`/`)는 이제 5개 섹션(Hero/Problem/Service/Craft/CTA)으로 구성됩니다 — 히어로(구조는
nypc.co.kr 티저 페이지를 참고해 최대한 가깝게 맞췄고, 사용자 요청에 따라 Phase 7 가드레일을 이번
슬라이스에 한해 예외 처리 — ADR-035; 배경에는 저작권이 만료된 베토벤 초상화 2점(Stieler 1820,
Mähler 1804-05, 둘 다 퍼블릭 도메인 확인 후 자체 호스팅 — ADR-036)이 서서히 전환되며 표시됩니다),
"Ask two AIs for the same song. Get two different songs" 문제 제기 섹션, Safe/Balanced/Bold·7개 이론
엔진·가사 A/B/C 초안을 성과 중심으로 소개하는 서비스 섹션, 실제 `docs/METHODOLOGY.md` 원칙 3가지를
소개하는 "Built on real songwriting craft" 섹션(실제 사용자가 없는 상태에서 후기를 지어내는 대신 택한
정직한 대안 — ADR-037), 그리고 로그인 없이 바로 써볼 수 있는 데모가 중심인 CTA 섹션입니다. 데모는
아이디어를 적고 "Generate"를 누르면 실제로(단, Mock 컴파일러로만, 과금·남용 위험을 원천 차단하기 위해
구조적으로 Gemini를 호출할 수 없게 만듦 — ADR-036) 결과를 보여주고, 저장하거나 진짜 Gemini/
Safe·Balanced·Bold를 쓰려면 그때 회원가입하도록 안내합니다. 기존 로그인/회원가입·소유권 체계는 전혀
바뀌지 않았습니다. 색상은 기존 보라/청록 팔레트에 크림슨/골드 톤을 더해 좀 더 예술적인 느낌을 살렸고
(`--color-accent-crimson`/`--color-accent-gold`), Tailwind 대신 기존 CSS Modules 체계를 그대로
확장했습니다(ADR-037 — 이 페이지 하나를 위해 새 스타일링 시스템을 들여올 이유가 없음). Theme/Ideation/
Melody-fit/Revision 전용 화면, 화자·시점·문화권 선택 UI, contrastPlan/hookPlan/repetitionPlan 편집 UI,
Sound Seed Orb·전체 8/14단계 위저드 UI·PWA/모바일은 아직 없습니다.

상세는 [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md), [`docs/PHASE_LOG.md`](docs/PHASE_LOG.md),
[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) 참고.

## 오늘 작업 요약 (2026-07-14)

Phase 2 후반 UI(참조·구조·감정 곡선 편집) + Phase 7 랜딩 페이지(1~3차: NYPC 스타일 히어로, 배경 아트 +
로그인 없는 데모, 5섹션 재구성)를 진행했습니다. 전체 내용은 `docs/PHASE_LOG.md`의 해당 항목(한글 요약
포함)과 아래 ADR들을 참고하세요.

### 스택

- Next.js App Router + TypeScript strict + CSS Modules — **Tailwind는 도입하지 않음**(기존 토큰
  체계로 충분했고, 페이지 하나 때문에 두 번째 스타일링 시스템을 들일 이유가 없었음 — ADR-037).
- Zod — 새 API 경계마다 요청 검증(`/api/demo/compile`의 `idea` 길이 제한 등).
- 기존 Prisma/Postgres, `@google/genai` Gemini 파이프라인을 그대로 재사용 — 단, 새 익명 데모는
  **구조적으로** Mock 컴파일러만 쓰도록 만듦(`compilePipelineDeps`를 아예 import하지 않음 — ADR-036).
- `next/image` + `IntersectionObserver`(네이티브 API, 별도 애니메이션 라이브러리 없음)로 히어로
  배경 크로스페이드/Ken Burns 효과와 섹션별 스크롤 reveal 구현.
- Wikimedia Commons에서 퍼블릭 도메인 이미지 소싱 — `WebFetch`로 라이선스 태그 확인, `curl -I`로
  실제 이미지 응답까지 검증 후 자체 호스팅.
- Vitest(유닛) + Playwright(E2E, 스크린샷 기반 시각 검증) — 오늘도 실제 버그를 잡아냄(아래 참고).
- ESLint `react-hooks` 플러그인의 `set-state-in-effect` 룰이 실제 리렌더링 이슈를 사전에 잡아줌.

### 오류 수정

- 저장 실패 시 에러 배너가 서버가 이미 반환하던 구체적 Zod 검증 메시지를 버리고 일반 메시지만
  보여주던 버그 — `issues[].message`를 이어붙이도록 수정.
- Mock 컴파일러의 `fields.lyrics`가 `northStar`가 아니라 `lyricsDesign.originalLyrics`에서만
  채워진다는 걸 놓쳐서, 로그인 없는 데모 결과의 "Lyrics"가 항상 비어 있던 버그 — 수정.
- 히어로의 `position: fixed` CTA 바 — 섹션이 2개일 때는 맞는 설계였지만, 5섹션으로 늘어나며 아래
  모든 섹션을 계속 가리는 버그가 됨 — 히어로 섹션에 스코프된 `position: absolute`로 수정.
- Playwright 관련 버그 3건: `getByRole("alert")`/`aria-hidden` 요소 중복 매칭(더 구체적인 locator·
  `data-testid`로 해결), `.locator()`를 같은 엘리먼트의 형제 속성에 체이닝해 30초 타임아웃 난 문제
  (복합 셀렉터로 해결).
- `happy-path.spec.ts`의 실제 Gemini 응답 지연 플레이키니스 — `git stash`로 오늘 변경 이전 코드에서도
  동일하게 재현됨을 확인(오늘 작업과 무관함을 확인만 하고, 근본 해결은 남겨둠).
- 상세는 `docs/TROUBLESHOOTING.md`의 해당 Phase 항목 참고.

### 방법론

- 멀티파일/아키텍처성 변경 전에는 Plan Mode로 먼저 조사 → 계획 작성 → 승인 후에만 구현.
- 소스 오브 트루스 문서(예: `CLAUDE.md`의 NYPC 레이아웃 가드레일)와 사용자의 새 지시가 충돌하면
  조용히 넘어가지 않고 먼저 알리고 확인받은 뒤 `DECISIONS.md`에 기록(ADR-035, ADR-036).
- 실제 유명인 사진(밥 딜런/비틀즈/마이클 잭슨/BTS/퀸) 요청은 초상권·저작권 리스크를 먼저 설명하고,
  검증 가능한 퍼블릭 도메인 자료(베토벤 초상화)로 대체.
- 인증이 필요 없는 API는 "주석으로 조심"이 아니라 "관련 모듈을 아예 import하지 않는" 방식으로
  구조적으로 안전하게 설계(Mock-only by construction — ADR-036).
- 마케팅 카피에 가짜 수치·가짜 고객 후기를 넣지 않고, 실제 코드로 강제되는 사실만 사용(ADR-037).
- 매 슬라이스마다 스크린샷 기반 라이브 검증 — 오늘만 레이아웃 버그 2건을 이 방식으로 실제로 잡음.
- 슬라이스 종료마다 `DECISIONS.md`(ADR) / `IMPLEMENTATION_PLAN.md` / `docs/PHASE_LOG.md`(한글 요약
  포함) / `docs/TROUBLESHOOTING.md` / `README.md`를 함께 갱신한 뒤 커밋 + 푸시.
- `CLAUDE.md`에 추가된 Self-directed Operating Manual(`docs/docs/CLAUDE_SELF_DIRECTED_OPERATING_MANUAL.md`)
  체계를 반영해 작업 진행.

## 시작하기

```bash
pnpm install
cp .env.example .env.local   # 값을 채운 뒤 사용 (절대 커밋하지 말 것)

pnpm dev         # 개발 서버
pnpm build       # 프로덕션 빌드
pnpm typecheck   # TypeScript strict 검사
pnpm lint        # ESLint
pnpm test        # Vitest 단위 테스트
```

## 로컬에서 DB 붙여서 확인하기

```bash
docker compose up -d           # 로컬 Postgres 실행
pnpm prisma migrate dev        # 마이그레이션 적용 (이미 있는 마이그레이션 파일들을 순서대로 적용)
pnpm dev                       # 개발 서버 (회원가입 -> 프로젝트 생성 -> 컴파일 -> 내보내기)

pnpm exec playwright install
pnpm test:e2e                  # Playwright happy-path 테스트
```

`.env.local`에 `GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE`가 모두 실제 값으로 채워져 있으면
컴파일 버튼이 실제 Gemini를 호출합니다 (개발 환경에서는 실패 시 Mock으로 자동 폴백). 비워두면 지금까지와
동일하게 Mock만 사용합니다.

## 보안

`GEMINI_API_KEY`는 서버 전용 환경 변수입니다. `NEXT_PUBLIC_` 접두사로 클라이언트에 노출하지 마세요.
채팅, 커밋, 로그, 스크린샷 등으로 노출된 키는 즉시 폐기하고 재발급하세요. 자세한 내용은
[`SECURITY_NOTICE.md`](SECURITY_NOTICE.md)를 참고하세요.

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

**Phase 0–5 + Phase 2 후반 UI(1차) + Phase 7(1~6차) 완료, 전부 라이브 검증까지 마침.** `SongDesignSpec` Zod 스키마,
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
참고). 메인 페이지(`/`)는 이제 4개 섹션(Hero/Problem/Service/Craft)으로 구성됩니다 — **히어로에
접속하자마자(스크롤 없이) 로그인 없는 데모(아이디어 입력 → Generate)가 바로 보입니다** — 데모가
페이지 맨 아래 있던 이전 구조(ADR-037)에서 히어로 안으로 옮겨졌습니다(ADR-038). 히어로 구조는
nypc.co.kr 티저 페이지를 참고해 최대한 가깝게 맞췄고(사용자 요청에 따라 Phase 7 가드레일을 이번
슬라이스에 한해 예외 처리 — ADR-035), 배경에는 저작권이 만료된 베토벤 초상화 2점(Stieler 1820,
Mähler 1804-05, 둘 다 퍼블릭 도메인 확인 후 자체 호스팅 — ADR-036)이 서서히 전환되며 표시됩니다.
스크롤하면 "Ask two AIs for the same song. Get two different songs" 문제 제기 섹션, Safe/Balanced/
Bold·7개 이론 엔진·가사 A/B/C 초안을 성과 중심으로 소개하는 서비스 섹션, 실제 `docs/METHODOLOGY.md`
원칙 3가지를 소개하는 "Built on real songwriting craft" 섹션(실제 사용자가 없는 상태에서 후기를
지어내는 대신 택한 정직한 대안 — ADR-037)이 설명 목록처럼 이어집니다. 데모는 아이디어를 적고
"Generate"를 누르면 실제로(단, Mock 컴파일러로만, 과금·남용 위험을 원천 차단하기 위해 구조적으로
Gemini를 호출할 수 없게 만듦 — ADR-036) 결과를 보여주고, 저장하거나 진짜 Gemini/Safe·Balanced·Bold를
쓰려면 그때 회원가입하도록 안내합니다. 기존 로그인/회원가입·소유권 체계는 전혀 바뀌지 않았습니다.
색상은 기존 보라/청록 팔레트에 크림슨/골드 톤을 더해 좀 더 예술적인 느낌을 살렸고
(`--color-accent-crimson`/`--color-accent-gold`), Tailwind 대신 기존 CSS Modules 체계를 그대로
확장했습니다(ADR-037 — 이 페이지 하나를 위해 새 스타일링 시스템을 들여올 이유가 없음). Theme/Ideation/
Melody-fit/Revision 전용 화면, 화자·시점·문화권 선택 UI, contrastPlan/hookPlan/repetitionPlan 편집 UI,
Sound Seed Orb·전체 8/14단계 위저드 UI·PWA/모바일은 아직 없습니다.

상세는 [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md), [`docs/PHASE_LOG.md`](docs/PHASE_LOG.md),
[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) 참고.

## 기술 스택

| 영역 | 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 16 (App Router) | 서버 컴포넌트 기본, 필요한 곳만 `"use client"` |
| 언어 | TypeScript (strict 모드) | 컴파일 타임에 최대한 많이 잡아냄 |
| 스타일 | CSS Modules | Tailwind 미도입 — 기존 토큰 체계로 충분 (ADR-037) |
| 패키지 매니저 | pnpm | |
| 데이터베이스 | PostgreSQL + Prisma 7 | 드라이버 어댑터 방식(`@prisma/adapter-pg`) |
| 인증 | Auth.js v5 (beta) | Credentials(이메일/비밀번호) + JWT 세션, bcryptjs 해싱 |
| 검증 | Zod | 모든 외부 입력 경계(API 요청, AI 출력)에서 사용 |
| AI | `@google/genai` (Gemini, Interactions API) | 서버 전용 호출, 실패 시 개발환경에서 Mock 자동 폴백 |
| AI 목(Mock) | 자체 제작 Mock LLM Provider | 결정론적 오프라인 응답 — 테스트/데모/CI용 |
| 이미지 | `next/image` | 자체 호스팅 정적 이미지(외부 서버 의존 없음) |
| 로컬 인프라 | Docker Compose | 로컬 Postgres 실행용 |
| 테스트 | Vitest(유닛) + Playwright(E2E) | 스크린샷 기반 시각 검증도 병행 |
| 린트 | ESLint (`eslint-config-next`, `react-hooks`) | `set-state-in-effect` 등 리액트 렌더링 규칙 포함 |
| 폰트 | Geist (`next/font/google`) | |

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

### 기술 아키텍처 상세 (코딩/AI 관점)

**1) AI 컴파일 파이프라인 — Mock과 Gemini는 "같은 인터페이스, 다른 구현체"**

```
사용자 입력 → SongDesignSpec (Zod로 검증된 곡 설계도)
           → 7개 이론 엔진 (src/theory/*, 순수 함수 — 오디오가 아니라 구조화된 텍스트만 검사)
           → Provider Registry (Generic/Suno/Udio 중 선택, src/providers/registry.ts)
           → PromptCompiler.compile()  ──┬── MockPromptCompiler (결정론적, 오프라인)
                                          └── GeminiPromptCompiler (@google/genai, 실제 API)
           → PromptEvaluator.evaluate() (동일하게 Mock/Gemini 분리)
           → Safe / Balanced / Bold 3개 병렬 결과 (src/compiler/pipeline.ts)
```

`PromptCompiler`/`PromptEvaluator`는 인터페이스(`src/compiler/types.ts`)이고, Mock과 Gemini는 그
인터페이스의 서로 다른 구현체입니다. 어느 쪽을 쓸지는 `src/lib/compilerDeps.ts` 한 곳에서
`GEMINI_API_KEY`/`GEMINI_MODEL`/`GEMINI_API_MODE` 환경변수 존재 여부로 결정됩니다 — 나머지 코드는
자기가 지금 Mock을 쓰는지 Gemini를 쓰는지 전혀 몰라도 되게 설계되어 있습니다(의존성 주입 패턴).

**2) 오늘 추가한 익명 데모가 "구조적으로" 안전한 이유**

`src/app/api/demo/compile/route.ts`는 위의 공용 `compilePipelineDeps`를 **아예 import하지 않고**,
`new MockPromptCompiler()` / `new MockPromptEvaluator()`를 직접 생성해서 씁니다. 즉 서버 환경변수에
진짜 Gemini 키가 들어있어도, 이 라우트의 코드 경로 자체에 Gemini로 갈 수 있는 분기가 존재하지 않습니다.
"실수로라도 익명 사용자가 과금되는 API를 호출하게 되는" 시나리오를 코드 구조로 원천 차단한 것 —
"조심하자"는 주석이 아니라 컴파일 타임에 이미 결정되는 구조적 안전장치입니다(`DECISIONS.md` ADR-036).

**3) 랜딩 페이지 컴포넌트 구조 — Next.js Server/Client Component 분리**

```
src/app/page.tsx (Server Component, 5개 섹션을 조립만 함)
 ├─ Hero.tsx        (Server) → HeroBackground.tsx (Client: setInterval로 이미지 전환)
 │                             → ScrollHint.tsx    (Client: scroll 이벤트 리스닝)
 ├─ Problem.tsx      (Server, 정적 카피 + Reveal로 감싸기만)
 ├─ Service.tsx      (Server)
 ├─ Craft.tsx        (Server)
 └─ CTA.tsx          (Server) → DemoForm.tsx (Client: fetch로 API 호출 + 상태 관리)

Reveal.tsx (Client, 공용) — IntersectionObserver로 "화면에 들어오면 나타나기" 구현
```

브라우저 API(타이머, 스크롤 이벤트, IntersectionObserver, fetch)가 필요한 부분만 `"use client"`로
쪼개고, 나머지는 서버에서 미리 렌더링됩니다 — Next.js App Router의 기본 원칙을 그대로 따른 구조입니다.

**4) 접근성/성능 디테일**

- `prefers-reduced-motion: reduce`일 때는 애니메이션 속도를 늦추는 게 아니라 **아예 실행하지 않음**
  (JS의 `matchMedia` 체크로 `setInterval`/`IntersectionObserver` 자체를 안 돌림 + CSS 전역 규칙으로
  이중 방어, `globals.css`).
- 이미지는 Wikimedia에서 직접 불러오지 않고 `public/images/hero/`에 다운로드해 자체 호스팅 —
  외부 서버 장애/속도에 영향받지 않고, Next.js의 반응형 이미지 최적화(`next/image`)도 그대로 적용.

**5) 검증 3단계**

1. `pnpm typecheck` / `pnpm lint` / `pnpm test`(Vitest, 로직 단위) / `pnpm build` — 기계적 검증.
2. Playwright E2E — 실제 브라우저에서 클릭·스크롤·폼 제출까지 시뮬레이션(`tests/e2e/landing.spec.ts`).
3. **스크린샷을 실제로 열어서 눈으로 확인** — 1·2번을 다 통과해도 "레이아웃이 겹친다" 같은 시각적
   버그는 코드/테스트만으로는 못 잡습니다. 오늘 잡은 CTA 바 겹침 버그가 정확히 이 케이스입니다.

## 오늘 작업 요약 (2026-07-15)

로그인 없는 데모(`DemoForm`)를 페이지 맨 아래 별도 CTA 섹션에서 **히어로 안으로** 옮겨서, 접속하자마자
스크롤 없이 프롬프트를 바로 써볼 수 있게 만들었습니다(ADR-038). 기존 CTA 섹션은 데모를 중복으로 갖고
있을 이유가 없어져서 삭제했고, 히어로 레이아웃도 `height: 100vh` + 절대좌표 고정 방식에서
`min-height: 100vh` + 일반 flexbox 중앙 정렬로 바꿔서, 데모 폼처럼 높이가 가변적인 콘텐츠를 넣어도
화면이 깨지지 않게 했습니다. 1280×720/1440×900/375×812 전부에서 헤드라인+설명+데모+로그인 링크가
스크롤 없이 한 화면에 들어가는 것을 스크린샷으로 확인했습니다. 페이지는 이제 4개 섹션(Hero(+데모)/
Problem/Service/Craft)입니다. 상세는 `docs/PHASE_LOG.md` Phase 7(4차) 항목과 `DECISIONS.md` ADR-038
참고.

**(이어서, Phase 7 5차)** `/login`·`/signup` 페이지를 메인 페이지와 같은 다크 테마·베토벤 배경·
크림슨/골드 버튼으로 다시 디자인했습니다(`AuthForm.module.css` 공유). "로그인하면 대화내역 보기"
요청에는 — 이 앱이 챗봇이 아니라 프로젝트 구조라 말 그대로의 대화내역은 없지만, 대신 이미 DB에 쌓이고
있던 두 가지 이력 데이터(설계도 버전 이력 `ProjectVersion` / 과거 컴파일 결과 `PromptPackage`)를
찾아서 사용자에게 그대로 보여드리고 골라달라고 했고, **과거 컴파일 결과 이력**을 선택받아
`GET /api/projects/{id}/history` + 프로젝트 페이지의 "View history" 버튼으로 구현했습니다. 또
Problem/Service/Craft 설명 섹션을 더 "톡톡 튀게" — 카드가 순서대로 통통 튀며 나타나고, 카드마다 다른
포인트 색이 붙습니다. "탑 음대 논문·음악계 거장 방법론을 AI에게 체득시켰다"는 설명 카드도 추가했는데,
지어낸 얘기가 아니라 `knowledge/composition_theory/top_music_school_general_composition.txt`
(Berklee/USC Thornton/NYU Steinhardt/Juilliard 커리큘럼 근거 명시)와 `docs/METHODOLOGY.md`(작사가
김이나·K-pop 작사팀 실무 관행을 이름까지 인용)에 실제로 있는 내용만 확인하고 썼습니다. 상세는
`docs/PHASE_LOG.md` Phase 7(5차)와 `DECISIONS.md` ADR-039/ADR-040 참고.

**(이어서, Phase 7 6차)** 우측 최상단에 언어 전환 버튼(E/한/日 순서)을 추가했습니다. 랜딩 페이지와
로그인/회원가입 페이지를 영어·한국어·일본어로 볼 수 있고, 클릭하면 새로고침 없이 즉시 바뀌며 쿠키에
저장되어 다음 방문에도 유지됩니다. 대시보드·프로젝트 편집기는 이번에 번역하지 않았습니다(따로 큰
작업이라 다음으로 미룸). `/ko`, `/ja` 같은 URL 방식 대신 쿠키 기반으로 가볍게 구현했는데, 그 대가로
`layout.tsx`가 쿠키를 서버에서 읽어야 해서 `/`·`/login`·`/signup`이 정적 렌더링에서 동적 렌더링으로
바뀌었습니다(빌드 결과로 실제 확인 — 숨기지 않고 기록). 상세는 `docs/PHASE_LOG.md` Phase 7(6차)와
`DECISIONS.md` ADR-041 참고.

### 스택 (2026-07-15)

- 새 npm 의존성은 오늘도 추가하지 않음(원칙 유지) — 언어 전환은 라이브러리(next-intl 등) 대신 React
  Context + 쿠키로 직접 구현.
- `next/headers`의 `cookies()` — 서버 컴포넌트(`layout.tsx`)에서 요청별 쿠키를 읽어 언어를 결정.
- React Context API(`createContext`/`useContext`) — `LocaleProvider`/`useLocale`/`useDictionary`.
- CSS 커스텀 프로퍼티(`--accent`)를 인라인 `style`로 컴포넌트에 전달해 카드마다 다른 포인트 색 구현.
- `HeroBackground`(베토벤 초상화 배경)를 랜딩 페이지뿐 아니라 `/login`·`/signup`에도 그대로 재사용.
- Prisma(`prisma.promptPackage.findMany`)로 프로젝트당 과거 컴파일 이력 조회 — 새 테이블/마이그레이션
  없이 이미 있는 데이터만 읽음.
- PowerShell로 Docker Desktop 프로세스를 직접 기동(`Start-Process`)하고 데몬이 뜰 때까지
  `until docker info` 방식으로 대기.
- 환경변수(`GEMINI_API_KEY` 등)를 일부러 비운 두 번째 dev 서버를 띄워 Mock 전용 모드로 강제 전환하는
  검증 기법 — 실제 Gemini 지연 문제를 피해 빠르고 결정론적인 검증을 확보.

### 오늘 발견한 이슈와 수정

- 히어로의 `position: fixed` CTA 바가 섹션이 5개로 늘어나며 다른 섹션을 가리던 문제(어제 발견) → 오늘은
  아예 데모를 히어로 안으로 합치면서 구조 자체를 재설계해 근본적으로 해소.
- 실제 Gemini 호출이 20~40초까지 걸려서 "히스토리" 기능의 라이브 검증이 막힘 → 원인이 이미 문서화된
  사전 이슈임을 확인하고, Mock 강제 모드로 검증을 우회(기능 자체의 버그 아님을 구분).
- Prisma가 생성한 클라이언트가 TypeScript 소스라서 순수 Node 스크립트(`node script.mjs`)로 직접 못
  돌림 → 스크립트로 DB에 시드 데이터 넣는 방식을 포기하고, Mock 서버 재기동으로 대체(더 강한 검증).
- `layout.tsx`에서 `cookies()`를 읽자 `/`, `/login`, `/signup`이 정적→동적 렌더링으로 바뀐 것을
  `pnpm build` 결과로 발견 → 버그가 아니라 "깜빡임 없음 vs. 정적 렌더링" 트레이드오프로 판단하고 감추지
  않고 문서화.

### 노하우 / 방법론

- 오늘도 여러 슬라이스(히어로+데모 통합, 인증 페이지 리디자인+이력 기능+생동감 있는 섹션, 다국어)
  전부 Plan Mode로 먼저 설계 → 승인받고 → 구현 → 검증 → 문서화 순서를 그대로 따름.
- "로그인하면 대화내역 보기"처럼 이 앱에 실제로 없는 개념을 요청받았을 때, 있는 척 지어내지 않고 실제
  코드/DB를 조사해서 무엇이 가능한지 사용자에게 그대로 보여주고 고르게 함.
- "탑 음대 논문·거장 방법론" 같은 마케팅 카피도 실제 `knowledge/` 파일과 `docs/METHODOLOGY.md`를 먼저
  읽어서 진짜 근거가 있는지 확인한 뒤에만 작성 — 검증 안 된 주장은 쓰지 않음.
- 로그인 없는 데모, 컴파일 이력 조회 같은 새 기능은 전부 "구조적으로 안전하게"(예: Mock 전용 컴파일러를
  아예 다른 모듈을 안 쓰는 방식으로) 설계하는 패턴을 계속 재사용.
- 번역 데이터를 TypeScript `interface`로 강제해서, 번역이 하나라도 빠지면 컴파일 에러가 나게 만들어
  "런타임에 조용히 영어로 깨지는" 상황을 원천 차단.
- 스크린샷을 실제로 열어보는 습관을 오늘도 유지 — 코드/테스트 통과만으로는 안 잡히는 시각적 버그를
  매 슬라이스 최소 1건씩 잡음.
- 성능/아키텍처 트레이드오프(정적→동적 렌더링 전환처럼)는 발견 즉시 조용히 넘기지 않고, 빌드 결과 같은
  실제 증거로 확인한 뒤 결정 기록(ADR)에 남김.

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

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

**Phase 0–5 + Phase 2 후반 UI(1차) + Phase 7(1차) 완료, 전부 라이브 검증까지 마침.** `SongDesignSpec` Zod 스키마,
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
참고). 메인 페이지(`/`)에는 다크 히어로 섹션과 아래로 스크롤하면 나오는 설명 섹션(Safe/Balanced/Bold,
7개 이론 엔진 소개)이 있으며, 구조는 nypc.co.kr 티저 페이지를 참고해 최대한 가깝게 맞췄고(사용자 요청에
따라 Phase 7 가드레일을 이번 슬라이스에 한해 예외 처리 — ADR-035) 실제 카피/색상/폰트/이미지는 이 프로젝트
고유의 것입니다. Theme/Ideation/Melody-fit/Revision 전용 화면, 화자·시점·문화권 선택 UI, contrastPlan/
hookPlan/repetitionPlan 편집 UI, Sound Seed Orb·실시간 데모·전체 8/14단계 위저드 UI·PWA/모바일은 아직
없습니다.

상세는 [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md), [`docs/PHASE_LOG.md`](docs/PHASE_LOG.md),
[`docs/TROUBLESHOOTING.md`](docs/TROUBLESHOOTING.md) 참고.

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

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
- Claude Code 작업 지침: [`CLAUDE.md`](CLAUDE.md)

## 현재 상태

**Phase 0–2 (1차 슬라이스) 코드 완료.** `SongDesignSpec` Zod 스키마, Generic/Suno/Udio Provider Registry,
Mock LLM Provider/Compiler/Evaluator, Gemini Provider 인터페이스(서버 전용 골격, 실제 네트워크 호출 없음),
Safe/Balanced/Bold Mock 컴파일 파이프라인, Auth.js 이메일/비밀번호 인증, Prisma/Postgres 영속성, 프로젝트
CRUD·컴파일·내보내기 API, 단일 페이지 프로젝트 편집기가 구현되어 있습니다. 전체 8단계 위저드 UI·실제 Gemini
연동·PWA/모바일은 아직 없습니다 (Phase 2 후반·Phase 3+ 예정).

이 저장소가 만들어진 개발 환경에는 Docker/Postgres가 없어 마이그레이션 적용과 실제 회원가입→컴파일→내보내기
흐름, Playwright E2E는 로컬에서 직접 실행해 확인해야 합니다 (아래 "로컬에서 DB 붙여서 확인하기" 참고).
상세는 [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md)와 [`docs/PHASE_LOG.md`](docs/PHASE_LOG.md) 참고.

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
docker compose up -d                        # 로컬 Postgres 실행
pnpm prisma migrate dev --name init          # 마이그레이션 적용
pnpm dev                                     # 개발 서버 (회원가입 -> 프로젝트 생성 -> 컴파일 -> 내보내기)

pnpm exec playwright install
pnpm test:e2e                                # Playwright happy-path 테스트
```

## 보안

`GEMINI_API_KEY`는 서버 전용 환경 변수입니다. `NEXT_PUBLIC_` 접두사로 클라이언트에 노출하지 마세요.
채팅, 커밋, 로그, 스크린샷 등으로 노출된 키는 즉시 폐기하고 재발급하세요. 자세한 내용은
[`SECURITY_NOTICE.md`](SECURITY_NOTICE.md)를 참고하세요.

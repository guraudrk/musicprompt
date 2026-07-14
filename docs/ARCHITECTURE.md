# Music Prompt Architect — Architecture

This document is generated from the Phase 0/1 planning pass. It records the system pipeline, the
module map for the single Next.js application, and a forward-compatible ERD draft for the Phase 2
persistence layer. See `DECISIONS.md` ADR-019 through ADR-023 for the decisions behind these
choices, and `IMPLEMENTATION_PLAN.md` §0.1 for the first-slice vs. MVP boundary.

## 1. Pipeline

`docs/PRODUCT_SPEC.md` §9 Stage A–H is the authoritative detailed form of the 10-step pipeline
summarized in `CLAUDE.md` §4 (mapping table in `DECISIONS.md` ADR-023).

```mermaid
flowchart TD
    U[User input] --> A[Stage A: Deterministic normalization]
    A --> SPEC[(SongDesignSpec)]
    SPEC --> B[Stage B: Theory enrichment\ncomposition + lyric engines]
    B --> C[Stage C: Provider projection\nProviderRegistry capability check]
    C --> D[Stage D: Gemini structured compiler]
    D --> E[Stage E: Deterministic validation\nschema, capability, locks, conflicts, overload]
    E -- blocking error --> G[Stage G: single repair pass]
    G --> E
    E -- ok --> F[Stage F: Independent evaluator]
    F --> H[Stage H: Final package assembly]
    H --> OUT[Safe / Balanced / Bold\nMusicAIPromptPackage x3]
```

In the first slice, Stage B (theory enrichment) is a pass-through stub — the real theory engines
(`FormFunctionEngine`, `ProsodyEngine`, etc.) are Phase 4. Stage D is served by either the
deterministic `MockPromptCompiler` (used in CI and this slice) or the `GeminiPromptCompiler`
(interface/skeleton only in this slice; live wiring is Phase 3).

## 2. Module map (single Next.js app, no monorepo yet — ADR-019)

```text
src/
  app/                       Next.js App Router pages/layout (minimal for this slice)
  domain/
    songDesignSpec/          types + Zod schema + normalizer + validator
    promptPackage/            MusicAIPromptPackage types + Zod schema
    providerCapability/        ProviderCapabilityProfile types + Zod schema
    evaluation/                PromptQualityReport types
    revision/                  RevisionDiagnosis types (stub — real logic is Phase 6)
    provenance.ts
  providers/
    registry.ts               ProviderRegistry interface + in-memory implementation
    profiles/generic.ts | suno.ts | udio.ts
  llm/
    types.ts                 LLMProvider interface
    mock/mockLLMProvider.ts, mockPromptCompiler.ts, mockPromptEvaluator.ts
    gemini/geminiLLMProvider.ts, geminiPromptCompiler.ts, geminiPromptEvaluator.ts (skeleton only)
  compiler/
    pipeline.ts               Stage A-H orchestration
  lib/
    env.ts                    server-only env accessor/validator (never imported by client code)
tests/unit/
```

## 3. ERD draft (Phase 2 persistence — drafted now for forward-compatibility)

No ORM/migration tool is chosen yet (pending decision in `DECISIONS.md`). This ERD is a draft for
alignment only; nothing here is scaffolded in the first slice.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    PROJECT ||--o{ PROJECT_VERSION : has
    PROJECT_VERSION ||--|| SONG_DESIGN_SPEC : snapshots
    PROJECT ||--o{ PROMPT_PACKAGE : produces
    PROMPT_PACKAGE }o--|| PROVIDER_PROFILE : compiled_for
    PROMPT_PACKAGE ||--o| EVALUATION_REPORT : scored_by
    PROJECT ||--o{ REVISION_LOG : records

    USER {
      string id PK
      string email
      datetime createdAt
    }
    PROJECT {
      string id PK
      string userId FK
      string workingTitle
      int currentVersion
      datetime createdAt
      datetime updatedAt
    }
    PROJECT_VERSION {
      string id PK
      string projectId FK
      int version
      jsonb songDesignSpec
      datetime createdAt
    }
    PROVIDER_PROFILE {
      string providerId PK
      string profileVersion PK
      string displayName
      string freshness
      jsonb capabilities
      datetime lastVerifiedAt
    }
    PROMPT_PACKAGE {
      string id PK
      string projectId FK
      string projectVersionId FK
      string providerId FK
      string providerProfileVersion FK
      string strategy
      jsonb fields
      jsonb warnings
      datetime createdAt
    }
    EVALUATION_REPORT {
      string id PK
      string promptPackageId FK
      jsonb scores
      jsonb issues
      datetime createdAt
    }
    REVISION_LOG {
      string id PK
      string projectId FK
      string issueType
      jsonb changedFieldPaths
      string fromVersionId
      string toVersionId
      datetime createdAt
    }
```

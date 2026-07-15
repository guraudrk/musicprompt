# Music Prompt Architect — Product Specification

## 0. Document purpose

This document defines the product behavior, domain model, automatic prompt-generation pipeline, provider architecture, Gemini integration, UX, security boundaries, and MVP acceptance criteria.

The product transforms a user's rough musical intention into a structured design and then compiles that design into prompts tailored to different music-generation AI tools.

It does not promise a hit song. It improves clarity, consistency, controllability, and iteration.

---

## 1. Product vision

### 1.1 One-line value proposition

Turn one musical idea into a reusable song blueprint and translate it into the language of multiple music-generation AIs.

### 1.2 Core product identity

The product is:

- A music-planning assistant
- A songwriting and lyric-design workspace
- A multi-provider prompt compiler
- A prompt comparison and revision tool
- A persistent project notebook

The product is not:

- A music-generation model
- A voice-cloning tool
- A style-cloning service
- A chart-success predictor
- An unofficial client for external music AI services
- A substitute for legal, licensing, or commercial-use review

---

## 2. Target users

1. A non-musician with a clear emotional or narrative idea
2. A lyricist who needs music-language translation
3. A songwriter comparing several AI music tools
4. A creator who wants to borrow a reference song's functional principles without copying it
5. A user who wants direct, simple lyrics
6. A user who wants metaphorical, narrative, or experimental lyrics
7. A developer or creative team that wants reusable provider-specific prompt packages

---

## 3. Core user journey

### 3.1 Start modes

- Start from a reference song
- Start from a pure idea
- Start from existing lyrics
- Start from an audio or melody note
- Fork a previous project

### 3.2 Main workflow

1. Select a music AI now, request a recommendation, or defer selection.
2. Define the song's North Star.
3. Describe the reference and what should be preserved or changed.
4. Declare at least three deliberate differences.
5. Create or select a generative core.
6. Design form, energy, tension, melody, rhythm, harmony, arrangement, and hook behavior.
7. Design lyrics.
8. Validate internal coherence and provider capability.
9. Compile Safe, Balanced, and Bold prompt packages.
10. Copy prompts into an external music AI.
11. Return and review the result.
12. Diagnose weaknesses.
13. Revise only the smallest necessary controls.
14. Save and compare versions.

---

## 4. Canonical domain model

All provider prompts must originate from a canonical `SongDesignSpec`.

Provider-specific fields must never become the primary project state.

### 4.1 Minimum `SongDesignSpec`

```ts
type SongDesignSpec = {
  projectId: string;
  version: number;

  identity: {
    workingTitle?: string;
    purpose: string;
    language: string;
    instrumental: boolean;
    targetAudience?: string;
    listeningContext?: string;
  };

  northStar: {
    audienceExperience: string;
    centralQuestion?: string;
    finalAftertaste: string;
    nonNegotiableCore: string;
    status: "draft" | "confirmed";
  };

  reference?: {
    songTitle?: string;
    artistName?: string;
    userReason: string;
    surfaceTraits: ReferenceTrait[];
    functionalPrinciples: ReferencePrinciple[];
    similarityGuardrails: string[];
  };

  deliberateDifferences: DeliberateDifference[];

  generativeCore: {
    candidates: GenerativeCoreCandidate[];
    selectedCandidateIds: string[];
    combinedCore?: string;
  };

  musicalIdentity: {
    genres: WeightedTag[];
    tempoDescription: string;
    bpmMin?: number;
    bpmMax?: number;
    keyMode?: string;
    timeSignature?: string;
    instrumentation: string[];
    vocalDescription?: string;
    rhythmicTraits: string[];
    harmonicTraits: string[];
    melodicTraits: string[];
    productionTraits: string[];
  };

  structure: DramaticSection[];
  emotionCurve: EmotionPoint[];
  contrastPlan: ContrastPlan[];
  hookPlan: HookPlan;
  repetitionPlan: RepetitionPlan;
  compositionTheory: CompositionTheorySpec;
  lyricsDesign: LyricsDesignSpec;
  exclusions: string[];

  providerSelection: {
    mode: "manual" | "recommend" | "generic" | "compare";
    selectedProviderIds: string[];
  };

  lockedFields: string[];
  provenance: FieldProvenance[];
};
```

### 4.2 Provenance

Every material field should identify its origin:

- `user_provided`
- `inferred_high_confidence`
- `inferred_low_confidence`
- `rule_generated`
- `unknown`

The UI must visually distinguish user input from AI inference.

---

## 5. Reference handling

### 5.1 Surface versus function

Surface traits include:

- Specific melody
- Specific lyrics
- Signature riff
- Distinctive vocal imitation
- Unique chord voicing
- Highly identifiable sound design

Functional principles include:

- Restrained verse versus expanded chorus
- Delayed narrative reveal
- Short title hook
- Silence before the chorus
- Final-chorus semantic transformation
- Bright music versus dark content

Only functional principles may be carried forward automatically.

### 5.2 Deliberate difference gate

Require at least three meaningful differences.

Examples:

- Change romantic dialogue into parent-child dialogue
- Change Japanese folk-pop texture into Korean piano ballad
- Change a happy resolution into an unresolved ending
- Change a melodic hook into a lyrical or rhythmic hook

A name change alone is not a deliberate difference.

---

## 6. Composition-theory integration

Use the repository composition knowledge as a decision framework, not a rigid formula.

### 6.1 Required theory engines

- `FormFunctionEngine`
- `MelodyMemoryEngine`
- `HarmonyGravityEngine`
- `RhythmMomentumEngine`
- `ProsodyEngine`
- `ArrangementFormEngine`
- `SubtractionEngine`

### 6.2 Required checks

- Each section has a dramatic function.
- Verse and chorus are audibly different.
- Pre-chorus creates a reason for the chorus.
- Final chorus differs meaningfully from the first.
- Highest note has a purpose.
- Important lyric stress aligns with musical stress unless intentionally contrasted.
- Arrangement density supports the structure.
- Silence is considered as an active rhythmic choice.
- Unnecessary ideas are identified for removal.

---

## 7. Lyric-design integration

### 7.1 Modes

- Simple and direct
- Direct
- Metaphorical
- Narrative
- Conversational
- Image-driven
- Hybrid
- Preserve original

### 7.2 Know-how intensity

- `none`
- `light`
- `balanced`
- `deep`

### 7.3 Required lyric workflow

1. Theme
2. Ideation
3. Draft
4. Melody fit
5. Revision

### 7.4 Cultural and professional practice profiles

- Korean pop singer and character fit
- Japanese narrative and viewpoint fit
- Global pop honesty, title, and syllable precision
- Hybrid
- User-defined

These profiles abstract workflow principles. They must not imitate an identifiable lyricist's style.

### 7.5 Direct lyrics rule

Direct, simple lyrics must not be penalized for lacking metaphor.

Evaluate them by:

- Emotional accuracy
- Natural pronunciation
- Singability
- Memorability
- Character credibility
- Economy of language

---

## 8. Multi-provider architecture

### 8.1 Initial provider profiles

- Generic
- Suno
- Udio

Phase 2 or later:

- Stable Audio
- Google Lyria
- Eleven Music
- MusicGen
- AIVA

### 8.2 Provider capability profile

```ts
type CapabilityState = "true" | "false" | "partial" | "unknown";

type ProviderCapabilityProfile = {
  providerId: string;
  displayName: string;
  officialUrl: string;
  profileVersion: string;
  lastVerifiedAt: string;
  freshness: "current" | "aging" | "stale" | "unknown";
  capabilities: Record<string, CapabilityState>;
  promptSchema: ProviderPromptSchema;
  limitations: string[];
  officialSourceUrls: string[];
  termsNotice: string;
};
```

### 8.3 Required capabilities

- text-to-music
- full song
- instrumental
- vocals
- custom lyrics
- multilingual lyrics
- section tags
- negative prompt or exclude field
- duration control
- BPM control
- key control
- audio reference
- melody conditioning
- continuation
- section editing
- stems
- API availability
- local execution

Unknown capabilities must not be presented as facts.

Unsupported user intents must be retained for switching providers later.

---

## 9. Automatic prompt-generation pipeline

This is the core implementation.

### 9.1 Design principle

Do not ask Gemini to invent the entire system from an unstructured paragraph.

The application must build structured musical intent first.

### 9.2 Pipeline stages

#### Stage A — Deterministic normalization

Convert UI inputs into normalized fields.

Examples:

- Trim and deduplicate tags
- Normalize 0–100 axes
- Sort emotion points
- Resolve empty values
- Preserve original lyrics
- Record locked fields

#### Stage B — Theory enrichment

Apply deterministic rules and selected knowledge.

Examples:

- Add section-function questions
- Check verse/chorus contrast
- Check title placement
- Check lyric density
- Create revision levers
- Identify missing deliberate differences
- Suggest subtraction candidates

The theory engines may recommend values but must record whether they are user-provided or inferred.

#### Stage C — Provider projection

Build a provider-neutral compiler input containing only:

- Confirmed North Star
- Selected generative core
- Confirmed deliberate differences
- Structure and contrast
- Hook and repetition
- Lyrics mode and selected principles
- Arrangement
- Exclusions
- Provider capabilities
- Strategy: Safe / Balanced / Bold

#### Stage D — Gemini structured compiler

Gemini receives the structured compiler input and generates a `MusicAIPromptPackage`.

Gemini responsibilities:

- Convert structured design into fluent prompt language
- Compress low-priority details
- Produce provider-specific fields
- Explain unsupported intents
- Produce a concise and a detailed version where appropriate
- Preserve locked lyrics and phrases
- Produce revision levers
- Address every active (non-dismissed) composition-theory engine warning with a traceable
  `theoryAddressal` entry (verbatim engine/message, concrete resolution) — never silently ignore one
- Ground the compiled prose directly in the cited composition-theory document
  (`knowledge/composition_theory/top_music_school_general_composition.txt`) — the 7 core
  principles, genre-specific topline guidance, and AI-prompting-specific advice — not just the
  engines' structural warnings
- Return only the agreed JSON structure

Gemini must not:

- Override user-confirmed fields
- Invent provider capabilities
- Add artist names to the final prompt
- Promise exact compliance
- Delete unsupported intents
- Rewrite locked lyrics
- Treat metaphor complexity as quality

#### Stage E — Deterministic validation

Validate:

- Zod schema
- Required provider fields
- Capability compatibility
- Locked-field preservation
- Artist-name abstraction
- Reference surface-copy risk
- Internal conflicts
- Prompt overload
- Empty or duplicated fields
- Unsupported-intent preservation
- Every active theory-engine warning has a matching, traceable `theoryAddressal` entry

#### Stage F — Independent evaluator

Use a separate system instruction and separate output schema.

Evaluate:

- North Star alignment
- Difference realization
- Clarity
- Coherence
- Controllability
- Provider compatibility
- Hook strategy
- Repetition and meaning
- Lyric-music alignment
- Overload risk
- Originality guardrails

This is a design-fit score, not an artistic absolute.

#### Stage G — Single repair pass

Allow one repair call only when:

- Structured output is invalid
- A blocking required field is missing
- A locked field was changed
- A provider capability was violated
- A severe conflict exists

The repair request must include the exact validation errors and prohibit unrelated rewriting.

#### Stage H — Final package

Return:

- Safe / Balanced / Bold versions
- Provider fields
- Copy bundle
- Theory rationale
- Warnings
- Unsupported intents
- Quality report
- Revision levers
- Provider-profile timestamp

### 9.3 Gemini adapter

```ts
interface LLMProvider {
  generateStructured<T>(input: {
    task: string;
    systemInstruction: string;
    payload: unknown;
    schema: unknown;
  }): Promise<T>;
}

interface GeminiPromptCompiler {
  compile(input: ProviderCompilerInput): Promise<MusicAIPromptPackage>;
  evaluate(input: PromptEvaluationInput): Promise<PromptQualityReport>;
  repair(input: PromptRepairInput): Promise<MusicAIPromptPackage>;
}
```

### 9.4 Server-only environment

Required variables:

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_API_MODE
```

Rules:

- Never prefix the key with `NEXT_PUBLIC_`.
- Never return it from an API route.
- Never log it.
- Never place it in a client component.
- Never store it in the database.
- Rotate any key exposed in chat, source control, screenshots, or logs.

### 9.5 SDK and API choice

At implementation time, verify the current official Google documentation.

Preferred characteristics:

- Official Google GenAI SDK
- Server-side JavaScript/TypeScript
- Structured outputs
- Zod or JSON Schema validation
- Stable API revision where available
- Adapter isolation from domain code

Do not bind the domain model to one Gemini endpoint or one model name.

---

## 10. Prompt package

```ts
type MusicAIPromptPackage = {
  providerId: string;
  providerDisplayName: string;
  providerProfileVersion: string;
  profileVerifiedAt: string;
  strategy: "safe" | "balanced" | "bold";

  genericDesignSummary: string;

  fields: {
    prompt?: string;
    style?: string;
    lyrics?: string;
    negativePrompt?: string;
    exclude?: string;
    title?: string;
    guidanceTags?: string[];
    structureNotes?: string;
    advancedParameters?: Record<string, string | number | boolean>;
  };

  theoryRationale: {
    northStar: string;
    selectedCore: string;
    deliberateDifferences: string[];
    form: string;
    contrast: string[];
    hook: string;
    repetition: string;
    lyrics: string;
  };

  unsupportedIntents: {
    intent: string;
    reason: string;
    suggestedProviderIds?: string[];
  }[];

  warnings: string[];
  toolInstructions: string[];
  revisionLevers: {
    fieldPath: string;
    purpose: string;
    safeAdjustment: string;
  }[];

  // One entry required per active (non-dismissed) engineWarning — see Stage D/E below.
  theoryAddressal: {
    engine: string;
    message: string;
    resolution: string;
  }[];

  promptQuality: PromptQualityReport;
  copyBundle: string;
};
```

---

## 11. Safe / Balanced / Bold

### Safe

- Clear genre identity
- Familiar structure
- Limited instrumentation
- Early and understandable hook
- Shorter prompt
- Higher provider compliance priority

### Balanced

- Familiar structure plus one or two distinctive decisions
- Clear emotional arc
- Stronger chorus differentiation
- Default recommendation

### Bold

- More unusual contrast, texture, rhythm, or structure
- The North Star and generative core remain stable
- Random complexity is not accepted as originality

The three versions must reflect different creative strategies, not superficial word changes.

---

## 12. Revision system

### 12.1 Default behavior

Change only one to three controls per iteration.

Lock everything else.

### 12.2 Diagnosis examples

Weak chorus:

- Core phrase length
- Title placement
- Register lift
- Silence before chorus
- Arrangement expansion
- Repeat/variation ratio

Boring verse:

- Narrative information
- Phrase length
- Rhythmic space
- Motif foreshadowing
- Transition

Flat emotion:

- Pre-chorus tension
- Contrast before climax
- Temporary drop
- Vocal intensity curve
- Final-chorus expansion

Scattered identity:

- Genre count
- Instrument count
- Hook count
- Metaphor count
- Section count
- North Star alignment

Awkward lyrics:

- Syllable density
- Mora or stress
- Vowels on sustained notes
- Breath position
- Unnecessary metaphor
- Character consistency

---

## 13. Web UX

### 13.1 Visual direction

Use the reference site's high-level qualities only:

- Immersive full-height hero
- Dark background
- Strong typography
- Focused central visual
- Clear primary CTA
- Scroll-based storytelling

Do not copy:

- Logo
- Brand assets
- Exact layout
- Copy
- Proprietary illustration
- Exact color system

### 13.2 Original music visual language

- Sound Seed Orb
- Waveform
- Spectrum
- Piano-roll fragments
- Motif becoming section architecture
- Lyrics snapping to rhythmic cells
- Provider prompt cards branching from one design

### 13.3 Main page sections

1. Header
2. Hero
3. Live transformation demo
4. Methodology story
5. Provider selector
6. Composition and Lyrics Labs
7. Before/after comparison
8. Web and app continuation
9. Final CTA

### 13.4 Accessibility and performance

- Keyboard navigation
- Visible focus
- Reduced motion
- Mobile fallback for graphs
- LCP target 2.5 seconds
- CLS target 0.1
- Lazy-load heavy visuals
- No forced autoplay video
- Do not sacrifice legibility for effects

---

## 14. PWA and mobile

### 14.1 Architecture

- Next.js web application
- Installable PWA
- Capacitor container for iOS and Android in later phases
- Shared domain and UI packages

### 14.2 Offline-capable actions

- Open existing projects
- Edit text
- Write lyric drafts
- Edit structure and emotion curves
- Preview generic prompt
- Queue exports

### 14.3 Native value

The mobile application must provide meaningful value beyond a web wrapper:

- Offline drafts
- Share sheet
- File import/export
- Deep links
- Network-state handling
- Secure token storage
- Optional voice memo
- Optional biometric project lock

---

## 15. Security and privacy

- The user's projects are private by default.
- External API keys are server-side secrets.
- Raw lyrics are not written to analytics.
- Structured logs contain task type, latency, model, token estimate, and error code.
- File uploads validate MIME type, extension, and size.
- Signed URLs or equivalent access control are required.
- Account deletion must be supported.
- Provider terms and commercial-use information must link to official sources.
- The system must not claim legal clearance.

---

## 16. MVP screens

1. Landing
2. Authentication
3. Dashboard
4. New-project mode selection
5. North Star Studio
6. Reference and Deliberate Difference
7. Basic Song DNA
8. Structure and emotion map
9. Lyrics mode
10. Provider selector
11. Prompt result
12. Version compare
13. Generation review
14. Settings

Advanced labs can be introduced progressively.

---

## 17. MVP API surface

```text
POST   /api/projects
GET    /api/projects
GET    /api/projects/{projectId}
PATCH  /api/projects/{projectId}
DELETE /api/projects/{projectId}

POST   /api/projects/{projectId}/spec/normalize
POST   /api/projects/{projectId}/spec/validate
POST   /api/projects/{projectId}/compile/{providerId}
POST   /api/projects/{projectId}/compile/compare
POST   /api/projects/{projectId}/evaluate
POST   /api/projects/{projectId}/revise

GET    /api/providers
GET    /api/providers/{providerId}
POST   /api/providers/recommend

GET    /api/projects/{projectId}/export/txt
GET    /api/projects/{projectId}/export/json
```

---

## 18. Testing requirements

### Unit

- SongDesignSpec validation
- North Star validation
- Deliberate-difference gate
- Provider capability checks
- Locked-field preservation
- Direct/simple lyric behavior
- Prosody language selection
- Safe/Balanced/Bold differentiation
- Prompt overload detection
- Gemini response parsing
- Repair-pass limits

### Integration

- Project create to prompt compile
- Mock compiler and Gemini compiler equivalence at schema level
- Generic to Suno/Udio projection
- Provider unsupported-intent preservation
- Evaluator output persistence
- Targeted revision with locked fields

### E2E

1. Create account
2. Create project
3. Confirm North Star
4. Add a reference and three differences
5. Choose direct or metaphorical lyrics
6. Select Suno and Udio
7. Generate three strategies
8. Copy a result
9. Record a weak-chorus review
10. Revise only hook-related controls
11. Export TXT and JSON

---

## 19. MVP acceptance criteria

- A user can create, save, reopen, and delete a private project.
- A valid SongDesignSpec is stored independently of provider prompts.
- Generic, Suno, and Udio profiles compile distinct packages.
- Gemini is called only from server-side code.
- Gemini returns structured output validated by Zod.
- Blocking errors trigger no more than one repair pass.
- Safe, Balanced, and Bold are meaningfully different.
- Unsupported intents remain visible.
- Locked lyrics remain unchanged.
- Direct lyrics are not penalized for low metaphor density.
- Copy, TXT export, and JSON export work.
- Core tests pass.
- No secrets are committed.
- The UI is responsive and accessible.

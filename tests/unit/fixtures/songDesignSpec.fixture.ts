import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";

/** A minimal, fully valid SongDesignSpec used as the base for unit test fixtures. */
export function buildValidSpec(overrides: Partial<SongDesignSpec> = {}): SongDesignSpec {
  const base: SongDesignSpec = {
    projectId: "project-1",
    version: 1,

    identity: {
      workingTitle: "Mirror",
      purpose: "A confessional pop ballad about self-deception.",
      language: "English",
      instrumental: false,
    },

    northStar: {
      audienceExperience:
        "A song where the narrator searches outward for who broke them, and finally realizes it was themselves, but can't quite admit it.",
      finalAftertaste: "Uneasy recognition, not resolution.",
      nonNegotiableCore: "The final chorus repeats the first chorus's line with a completely different meaning.",
      status: "confirmed",
    },

    deliberateDifferences: [
      { id: "diff-1", dimension: "genre", fromReference: "rock", toNew: "piano alternative ballad" },
      { id: "diff-2", dimension: "theme", fromReference: "romantic loss", toNew: "self-deception" },
      { id: "diff-3", dimension: "ending", fromReference: "resolved", toNew: "unresolved" },
    ],

    generativeCore: {
      candidates: [
        { id: "core-1", type: "lyric_line", description: "\"I never found the one who broke me.\"", strengthScore: 80 },
      ],
      selectedCandidateIds: ["core-1"],
      combinedCore: "\"I never found the one who broke me.\"",
    },

    musicalIdentity: {
      genres: [{ tag: "alternative-ballad", weight: 80 }],
      tempoDescription: "slow, restrained",
      instrumentation: ["piano", "upright bass"],
      rhythmicTraits: [],
      harmonicTraits: [],
      melodicTraits: [],
      productionTraits: [],
    },

    structure: [
      { id: "sec-1", name: "Verse 1", dramaticFunction: "initiation", order: 0, energyLevel: 20 },
      { id: "sec-2", name: "Chorus", dramaticFunction: "arrival", order: 1, energyLevel: 70 },
      { id: "sec-3", name: "Final Chorus", dramaticFunction: "expanded_return", order: 2, energyLevel: 95 },
    ],

    emotionCurve: [
      { position: 0, energy: 20, tension: 10 },
      { position: 100, energy: 95, tension: 90 },
    ],

    contrastPlan: [{ dimension: "register", between: ["low", "high"], description: "Verse stays low; final chorus lifts an octave." }],

    hookPlan: {
      candidates: [{ id: "hook-1", type: "lyrical", description: "\"I never found the one who broke me.\"" }],
      selectedId: "hook-1",
      placementSection: "Chorus",
    },

    repetitionPlan: {
      exactRepeats: ["I never found the one who broke me."],
      surfaceVariations: [],
      meaningShifts: [
        {
          line: "I never found the one who broke me.",
          firstMeaning: "innocent confusion",
          finalMeaning: "self-deception",
        },
      ],
    },

    compositionTheory: {
      engineWarnings: [],
    },

    lyricsDesign: {
      mode: "direct",
      knowHowIntensity: "light",
      selectedTechniques: [],
      excludedTechniques: [],
      lockedLines: ["I never found the one who broke me."],
      workflowStage: "draft",
    },

    exclusions: ["EDM drop", "rap verse"],

    providerSelection: {
      mode: "compare",
      selectedProviderIds: ["generic", "suno", "udio"],
    },

    lockedFields: ["lyricsDesign.lockedLines"],
    provenance: [{ fieldPath: "northStar.audienceExperience", origin: "user_provided" }],
  };

  return { ...base, ...overrides };
}

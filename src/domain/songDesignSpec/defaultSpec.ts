import type { SongDesignSpec } from "./schema";

/** A minimal, schema-valid starting point for a brand-new project (placeholder copy the user immediately edits). */
export function buildDefaultSpec(projectId: string): SongDesignSpec {
  return {
    projectId,
    version: 1,

    identity: {
      purpose: "Untitled purpose",
      language: "English",
      instrumental: false,
    },

    northStar: {
      audienceExperience: "Describe what this song should make the listener feel or realize.",
      finalAftertaste: "Describe the feeling that should remain after the song ends.",
      nonNegotiableCore: "Describe the one thing that must not be lost.",
      status: "draft",
    },

    deliberateDifferences: [],

    generativeCore: { candidates: [], selectedCandidateIds: [] },

    musicalIdentity: {
      genres: [],
      tempoDescription: "unspecified",
      instrumentation: [],
      rhythmicTraits: [],
      harmonicTraits: [],
      melodicTraits: [],
      productionTraits: [],
    },

    structure: [],
    emotionCurve: [],
    contrastPlan: [],
    hookPlan: { candidates: [] },
    repetitionPlan: { exactRepeats: [], surfaceVariations: [], meaningShifts: [] },
    compositionTheory: { engineWarnings: [], dismissedWarnings: [] },

    lyricsDesign: {
      mode: "direct",
      knowHowIntensity: "none",
      selectedTechniques: [],
      excludedTechniques: [],
      lockedLines: [],
      workflowStage: "theme",
    },

    exclusions: [],

    providerSelection: { mode: "manual", selectedProviderIds: ["generic"] },

    lockedFields: [],
    provenance: [],
  };
}

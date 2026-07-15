import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type {
  CompilerOutput,
  MusicAIPromptPackage,
  PromptFields,
  Strategy,
  TheoryRationale,
} from "@/domain/promptPackage/schema";
import type { PromptQualityReport } from "@/domain/evaluation/schema";

/**
 * Fields that are 100% mechanically derivable from the spec — no LLM reasoning involved. Extracted
 * from what `mockOutputBuilders.ts` was already computing inline (proof these never needed a
 * compiler's creative judgment) so both Mock and Gemini paths assemble the full
 * `MusicAIPromptPackage` identically, after Stage D/E/G produce a validated `CompilerOutput`
 * (ADR-050).
 */
export function buildTheoryRationale(spec: SongDesignSpec): TheoryRationale {
  const selectedHook = spec.hookPlan.candidates.find((h) => h.id === spec.hookPlan.selectedId);
  const selectedCore =
    spec.generativeCore.combinedCore ??
    spec.generativeCore.candidates.find((c) => spec.generativeCore.selectedCandidateIds.includes(c.id))?.description ??
    "unspecified";

  return {
    northStar: spec.northStar.audienceExperience,
    selectedCore,
    deliberateDifferences: spec.deliberateDifferences.map((d) => `${d.dimension}: ${d.fromReference} -> ${d.toNew}`),
    form: spec.structure.map((s) => s.name).join(" > "),
    contrast: spec.contrastPlan.map((c) => c.description),
    hook: selectedHook?.description ?? "unselected",
    repetition: spec.repetitionPlan.meaningShifts.map((m) => m.line).join("; "),
    lyrics: spec.lyricsDesign.mode,
  };
}

export function buildToolInstructions(provider: ProviderCapabilityProfile): string[] {
  return [`Paste the fields above into ${provider.displayName}.`];
}

export function buildWarningsList(theorySummary: CompositionTheorySpec): string[] {
  return theorySummary.engineWarnings.map((w) => w.message);
}

/**
 * Reads from the compiler's *actual returned* `fields` (title/style/lyrics/negativePrompt) rather
 * than recomputing from `spec` independently — this is slightly more correct than the old
 * Mock-only version, which duplicated lyrics-body construction instead of trusting `fields.lyrics`.
 */
export function buildCopyBundle(fields: PromptFields, workingTitle?: string): string {
  return `Title: ${fields.title ?? workingTitle ?? "Untitled"}\n\nStyle: ${fields.style ?? ""}\n\nLyrics:\n${
    fields.lyrics ?? ""
  }\n\nExclude: ${fields.negativePrompt ?? "none"}`;
}

/** Type-satisfying placeholder used only until Stage F's real evaluator overwrites it. */
export function placeholderQuality(strategy: Strategy): PromptQualityReport {
  const neutral = 50;
  return {
    strategy,
    scores: {
      northStarAlignment: neutral,
      differenceRealization: neutral,
      clarity: neutral,
      coherence: neutral,
      controllability: neutral,
      providerCompatibility: neutral,
      hookStrategy: neutral,
      repetitionAndMeaning: neutral,
      lyricMusicAlignment: neutral,
      overloadRisk: neutral,
      originalityGuardrails: neutral,
    },
    issues: [],
    overallNotes: "Pending independent evaluation (Stage F).",
  };
}

/** Combines a validated `CompilerOutput` with every deterministically-assembled field. */
export function assembleFullPackage(
  spec: SongDesignSpec,
  provider: ProviderCapabilityProfile,
  strategy: Strategy,
  theorySummary: CompositionTheorySpec,
  output: CompilerOutput,
): MusicAIPromptPackage {
  return {
    providerId: provider.providerId,
    providerDisplayName: provider.displayName,
    providerProfileVersion: provider.profileVersion,
    profileVerifiedAt: provider.lastVerifiedAt,
    strategy,
    ...output,
    theoryRationale: buildTheoryRationale(spec),
    warnings: buildWarningsList(theorySummary),
    toolInstructions: buildToolInstructions(provider),
    promptQuality: placeholderQuality(strategy),
    copyBundle: buildCopyBundle(output.fields, spec.identity.workingTitle),
  };
}

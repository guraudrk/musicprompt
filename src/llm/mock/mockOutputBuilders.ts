import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { MusicAIPromptPackage, Strategy, UnsupportedIntent } from "@/domain/promptPackage/schema";
import type { PromptQualityReport, EvaluationIssue } from "@/domain/evaluation/schema";
import type { ProviderCompilerInput, PromptEvaluationInput } from "@/compiler/types";

type StrategyProfile = {
  label: string;
  styleAdjective: string;
  extraGuidanceTag: string;
  maxInstruments: number;
};

const STRATEGY_PROFILES: Record<Strategy, StrategyProfile> = {
  safe: { label: "Safe", styleAdjective: "familiar and stable", extraGuidanceTag: "clear-genre", maxInstruments: 2 },
  balanced: { label: "Balanced", styleAdjective: "familiar with one distinctive twist", extraGuidanceTag: "signature-detail", maxInstruments: 4 },
  bold: { label: "Bold", styleAdjective: "unusual and exploratory", extraGuidanceTag: "bold-experimental", maxInstruments: 8 },
};

function collectUnsupportedIntents(
  spec: SongDesignSpec,
  provider: ProviderCapabilityProfile,
): UnsupportedIntent[] {
  const intents: UnsupportedIntent[] = [];

  if (!spec.identity.instrumental && provider.capabilities.customLyrics === "false") {
    intents.push({
      intent: "custom lyrics",
      reason: `${provider.displayName} does not support custom lyrics.`,
    });
  }
  if (spec.identity.language.trim().toLowerCase() !== "english" && provider.capabilities.multilingualLyrics === "false") {
    intents.push({
      intent: `lyrics in ${spec.identity.language}`,
      reason: `${provider.displayName} does not support multilingual lyrics.`,
    });
  }
  if (spec.structure.length > 0 && provider.capabilities.sectionTags === "false") {
    intents.push({
      intent: "section tags (Verse/Chorus/Bridge)",
      reason: `${provider.displayName} does not support section tags.`,
    });
  }

  return intents;
}

function buildStyleText(spec: SongDesignSpec, strategyProfile: StrategyProfile): string {
  const genreList = spec.musicalIdentity.genres.map((g) => g.tag).join("/") || "unspecified genre";
  const instruments = spec.musicalIdentity.instrumentation.slice(0, strategyProfile.maxInstruments).join(", ") || "unspecified instrumentation";
  return `${genreList} at ${spec.musicalIdentity.tempoDescription}, ${strategyProfile.styleAdjective}. Instrumentation: ${instruments}.`;
}

function buildPromptText(spec: SongDesignSpec, strategyProfile: StrategyProfile): string {
  return `${spec.northStar.audienceExperience} — ${strategyProfile.label} strategy. Final aftertaste: ${spec.northStar.finalAftertaste}.`;
}

function buildGuidanceTags(spec: SongDesignSpec, strategyProfile: StrategyProfile): string[] {
  const genreTags = spec.musicalIdentity.genres.map((g) => g.tag);
  return [...genreTags, strategyProfile.extraGuidanceTag];
}

function placeholderQuality(strategy: Strategy): PromptQualityReport {
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

/** Stage D (Mock): deterministically builds a MusicAIPromptPackage from structured spec input. */
export function buildCompilePayload(input: ProviderCompilerInput): MusicAIPromptPackage {
  const { spec, provider, strategy } = input;
  const strategyProfile = STRATEGY_PROFILES[strategy];

  const lyricsBody = [spec.lyricsDesign.originalLyrics, ...spec.lyricsDesign.lockedLines]
    .filter((line): line is string => Boolean(line && line.trim().length > 0))
    .join("\n");

  const selectedHook = spec.hookPlan.candidates.find((h) => h.id === spec.hookPlan.selectedId);
  const selectedCore =
    spec.generativeCore.combinedCore ??
    spec.generativeCore.candidates.find((c) => spec.generativeCore.selectedCandidateIds.includes(c.id))?.description ??
    "unspecified";

  const style = buildStyleText(spec, strategyProfile);
  const prompt = buildPromptText(spec, strategyProfile);
  const title = spec.identity.workingTitle;
  const negativePrompt = spec.exclusions.join(", ") || undefined;

  return {
    providerId: provider.providerId,
    providerDisplayName: provider.displayName,
    providerProfileVersion: provider.profileVersion,
    profileVerifiedAt: provider.lastVerifiedAt,
    strategy,
    genericDesignSummary: `${spec.northStar.audienceExperience} (${strategyProfile.label} strategy)`,
    fields: {
      prompt,
      style,
      lyrics: lyricsBody || undefined,
      negativePrompt,
      title,
      guidanceTags: buildGuidanceTags(spec, strategyProfile),
      structureNotes: spec.structure.map((s) => `${s.name}: ${s.dramaticFunction}`).join(" -> "),
    },
    theoryRationale: {
      northStar: spec.northStar.audienceExperience,
      selectedCore,
      deliberateDifferences: spec.deliberateDifferences.map((d) => `${d.dimension}: ${d.fromReference} -> ${d.toNew}`),
      form: spec.structure.map((s) => s.name).join(" > "),
      contrast: spec.contrastPlan.map((c) => c.description),
      hook: selectedHook?.description ?? "unselected",
      repetition: spec.repetitionPlan.meaningShifts.map((m) => m.line).join("; "),
      lyrics: spec.lyricsDesign.mode,
    },
    unsupportedIntents: collectUnsupportedIntents(spec, provider),
    warnings: [],
    toolInstructions: [`Paste the fields above into ${provider.displayName}.`],
    revisionLevers: [],
    promptQuality: placeholderQuality(strategy),
    copyBundle: `Title: ${title ?? "Untitled"}\n\nStyle: ${style}\n\nLyrics:\n${lyricsBody}\n\nExclude: ${negativePrompt ?? "none"}`,
  };
}

/** Stage F (Mock): deterministically scores a compiled package against its source spec. */
export function buildEvaluatePayload(input: PromptEvaluationInput): PromptQualityReport {
  const { spec, package: pkg } = input;

  const lockedPreserved = spec.lyricsDesign.lockedLines.every((line) => (pkg.fields.lyrics ?? "").includes(line));

  const issues: EvaluationIssue[] = [];
  if (!lockedPreserved) {
    issues.push({
      dimension: "originalityGuardrails",
      severity: "blocking",
      message: "A locked lyric line is missing from the compiled output.",
    });
  }

  return {
    strategy: pkg.strategy,
    scores: {
      northStarAlignment: pkg.theoryRationale.northStar === spec.northStar.audienceExperience ? 90 : 60,
      differenceRealization: spec.deliberateDifferences.length > 0 ? Math.min(100, 60 + spec.deliberateDifferences.length * 10) : 50,
      clarity: 75,
      coherence: 75,
      controllability: 75,
      providerCompatibility: pkg.unsupportedIntents.length === 0 ? 90 : 60,
      hookStrategy: pkg.theoryRationale.hook !== "unselected" ? 80 : 40,
      repetitionAndMeaning: spec.repetitionPlan.meaningShifts.length > 0 ? 80 : 50,
      lyricMusicAlignment: 70,
      overloadRisk: spec.musicalIdentity.genres.length > 3 ? 40 : 80,
      originalityGuardrails: lockedPreserved ? 90 : 20,
    },
    issues,
    overallNotes: issues.length > 0 ? "Blocking issues found." : "No blocking issues found.",
  };
}

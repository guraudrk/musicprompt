import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { CompilerOutput, Strategy, TheoryAddressal, UnsupportedIntent } from "@/domain/promptPackage/schema";
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

/**
 * Deterministic stand-in for Gemini's required per-warning `theoryAddressal` (see
 * provider-compiler.system.md). Mock never applies real creative judgment, so it just acknowledges
 * every *required* (warning/blocking severity — ADR-045) active warning honestly — this exists to
 * keep Mock passing the same Stage E validateTheoryAddressal() check Gemini output must pass, not
 * to demonstrate real revision. Info-severity warnings are left unaddressed here too, matching the
 * validator's scope.
 */
function buildTheoryAddressal(theorySummary: CompositionTheorySpec): TheoryAddressal[] {
  return theorySummary.engineWarnings
    .filter((warning) => warning.severity === "warning" || warning.severity === "blocking")
    .map((warning) => ({
      engine: warning.engine,
      message: warning.message,
      resolution: warning.suggestion
        ? `Mock: applied deterministic placeholder — ${warning.suggestion}`
        : "Mock: acknowledged; sign up for a Gemini-backed compile for a real revision.",
    }));
}

/**
 * Stage D (Mock): deterministically builds the creative-only `CompilerOutput` from structured spec
 * input (ADR-050) — provider metadata, theoryRationale, warnings, toolInstructions, promptQuality,
 * and copyBundle are no longer part of a compiler's job; they're assembled deterministically in
 * `src/compiler/deterministicFields.ts` after Stage E validates this output, for both Mock and
 * Gemini alike.
 */
export function buildCompilePayload(input: ProviderCompilerInput): CompilerOutput {
  const { spec, provider, strategy, theorySummary } = input;
  const strategyProfile = STRATEGY_PROFILES[strategy];

  const lyricsBody = [spec.lyricsDesign.originalLyrics, ...spec.lyricsDesign.lockedLines]
    .filter((line): line is string => Boolean(line && line.trim().length > 0))
    .join("\n");

  const style = buildStyleText(spec, strategyProfile);
  const prompt = buildPromptText(spec, strategyProfile);
  const title = spec.identity.workingTitle;
  const negativePrompt = spec.exclusions.join(", ") || undefined;

  return {
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
    unsupportedIntents: collectUnsupportedIntents(spec, provider),
    revisionLevers: [],
    theoryAddressal: buildTheoryAddressal(theorySummary),
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

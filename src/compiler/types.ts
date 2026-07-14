import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { MusicAIPromptPackage, Strategy } from "@/domain/promptPackage/schema";
import type { PromptQualityReport } from "@/domain/evaluation/schema";

export type ProviderCompilerInput = {
  spec: SongDesignSpec;
  provider: ProviderCapabilityProfile;
  strategy: Strategy;
  theorySummary: CompositionTheorySpec;
};

export type PromptEvaluationInput = {
  spec: SongDesignSpec;
  package: MusicAIPromptPackage;
};

export type PromptRepairInput = {
  originalInput: ProviderCompilerInput;
  invalidOutput: unknown;
  validationErrors: string[];
};

/** ADR-009: compiler and evaluator are separate roles with separate system instructions. */
export interface PromptCompiler {
  compile(input: ProviderCompilerInput): Promise<MusicAIPromptPackage>;
  /** ADR-010: at most one repair pass, only for blocking errors. */
  repair(input: PromptRepairInput): Promise<MusicAIPromptPackage>;
}

export interface PromptEvaluator {
  evaluate(input: PromptEvaluationInput): Promise<PromptQualityReport>;
}

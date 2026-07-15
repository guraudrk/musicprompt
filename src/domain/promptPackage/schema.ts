import { z } from "zod";
import { PromptQualityReportSchema } from "@/domain/evaluation/schema";
import { TheoryEngineNameSchema } from "@/domain/songDesignSpec/theory";

/** Bump when MusicAIPromptPackageSchema changes materially; persisted alongside compiled packages (IMPLEMENTATION_PLAN.md §3.6). */
export const SCHEMA_VERSION = "2";

export const StrategySchema = z.enum(["safe", "balanced", "bold"]);
export type Strategy = z.infer<typeof StrategySchema>;

export const PromptFieldsSchema = z.object({
  prompt: z.string().optional(),
  style: z.string().optional(),
  lyrics: z.string().optional(),
  negativePrompt: z.string().optional(),
  exclude: z.string().optional(),
  title: z.string().optional(),
  guidanceTags: z.array(z.string()).max(8).optional(),
  structureNotes: z.string().optional(),
  advancedParameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});
export type PromptFields = z.infer<typeof PromptFieldsSchema>;

export const TheoryRationaleSchema = z.object({
  northStar: z.string(),
  selectedCore: z.string(),
  deliberateDifferences: z.array(z.string()),
  form: z.string(),
  contrast: z.array(z.string()),
  hook: z.string(),
  repetition: z.string(),
  lyrics: z.string(),
});
export type TheoryRationale = z.infer<typeof TheoryRationaleSchema>;

export const UnsupportedIntentSchema = z.object({
  intent: z.string().min(1),
  reason: z.string().min(1),
  suggestedProviderIds: z.array(z.string()).max(5).optional(),
});
export type UnsupportedIntent = z.infer<typeof UnsupportedIntentSchema>;

export const RevisionLeverSchema = z.object({
  fieldPath: z.string().min(1),
  purpose: z.string().min(1),
  safeAdjustment: z.string().min(1),
});
export type RevisionLever = z.infer<typeof RevisionLeverSchema>;

/**
 * Self-reported, deterministically-checked link between a theory-engine warning
 * (`spec.compositionTheory.engineWarnings`, already dismissal-filtered) and how this specific
 * compile addressed it — mirrors the same traceability pattern already proven for
 * `LyricsDraft.techniquesUsed` (src/lyrics/validateDraftSet.ts). `message` must match an actual
 * warning verbatim (checked by src/compiler/validateTheoryAddressal.ts); `resolution` must state
 * either what changed to address it or an honest reason it couldn't be — never a vague non-answer.
 */
export const TheoryAddressalSchema = z.object({
  engine: TheoryEngineNameSchema,
  message: z.string().min(1),
  resolution: z.string().min(1),
});
export type TheoryAddressal = z.infer<typeof TheoryAddressalSchema>;

// Array fields the LLM must generate (theoryAddressal/unsupportedIntents/revisionLevers/
// guidanceTags/suggestedProviderIds) carry .max() bounds because an unbounded array in Gemini's
// schema-constrained decoding, combined with a long system instruction, reproducibly hangs past
// 180s with no response — confirmed by isolating system-instruction size, schema size, and array
// boundedness independently against the real API (ADR-051). Bounding array length resolves it.
export const MusicAIPromptPackageSchema = z.object({
  providerId: z.string().min(1),
  providerDisplayName: z.string().min(1),
  providerProfileVersion: z.string().min(1),
  profileVerifiedAt: z.string().min(1),
  strategy: StrategySchema,

  genericDesignSummary: z.string().min(1),

  fields: PromptFieldsSchema,
  theoryRationale: TheoryRationaleSchema,
  unsupportedIntents: z.array(UnsupportedIntentSchema).max(8),
  warnings: z.array(z.string()),
  toolInstructions: z.array(z.string()),
  revisionLevers: z.array(RevisionLeverSchema).max(8),
  theoryAddressal: z.array(TheoryAddressalSchema).max(7),

  promptQuality: PromptQualityReportSchema,
  copyBundle: z.string(),
});
export type MusicAIPromptPackage = z.infer<typeof MusicAIPromptPackageSchema>;

/**
 * The subset of `MusicAIPromptPackage` that actually requires creative reasoning from a compiler
 * (Mock or Gemini) — everything else (provider metadata, `theoryRationale`, `warnings`,
 * `toolInstructions`, `copyBundle`, and `promptQuality`) is either already known server-side or
 * mechanically derivable from the input spec/fields, and is assembled deterministically in
 * `src/compiler/deterministicFields.ts` after a compile succeeds (ADR-050). Asking the LLM to also
 * generate those fields was pure wasted output — `promptQuality` in particular is unconditionally
 * overwritten by the separate Stage F evaluator's result (`pipeline.ts`), so whatever a compiler
 * produced there was previously generated, validated, and discarded on every single call.
 */
export const CompilerOutputSchema = MusicAIPromptPackageSchema.omit({
  providerId: true,
  providerDisplayName: true,
  providerProfileVersion: true,
  profileVerifiedAt: true,
  strategy: true,
  theoryRationale: true,
  warnings: true,
  toolInstructions: true,
  promptQuality: true,
  copyBundle: true,
});
export type CompilerOutput = z.infer<typeof CompilerOutputSchema>;

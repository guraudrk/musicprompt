import { z } from "zod";
import { PromptQualityReportSchema } from "@/domain/evaluation/schema";

/** Bump when MusicAIPromptPackageSchema changes materially; persisted alongside compiled packages (IMPLEMENTATION_PLAN.md §3.6). */
export const SCHEMA_VERSION = "1";

export const StrategySchema = z.enum(["safe", "balanced", "bold"]);
export type Strategy = z.infer<typeof StrategySchema>;

export const PromptFieldsSchema = z.object({
  prompt: z.string().optional(),
  style: z.string().optional(),
  lyrics: z.string().optional(),
  negativePrompt: z.string().optional(),
  exclude: z.string().optional(),
  title: z.string().optional(),
  guidanceTags: z.array(z.string()).optional(),
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
  suggestedProviderIds: z.array(z.string()).optional(),
});
export type UnsupportedIntent = z.infer<typeof UnsupportedIntentSchema>;

export const RevisionLeverSchema = z.object({
  fieldPath: z.string().min(1),
  purpose: z.string().min(1),
  safeAdjustment: z.string().min(1),
});
export type RevisionLever = z.infer<typeof RevisionLeverSchema>;

export const MusicAIPromptPackageSchema = z.object({
  providerId: z.string().min(1),
  providerDisplayName: z.string().min(1),
  providerProfileVersion: z.string().min(1),
  profileVerifiedAt: z.string().min(1),
  strategy: StrategySchema,

  genericDesignSummary: z.string().min(1),

  fields: PromptFieldsSchema,
  theoryRationale: TheoryRationaleSchema,
  unsupportedIntents: z.array(UnsupportedIntentSchema),
  warnings: z.array(z.string()),
  toolInstructions: z.array(z.string()),
  revisionLevers: z.array(RevisionLeverSchema),

  promptQuality: PromptQualityReportSchema,
  copyBundle: z.string(),
});
export type MusicAIPromptPackage = z.infer<typeof MusicAIPromptPackageSchema>;

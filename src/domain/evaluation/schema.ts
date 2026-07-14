import { z } from "zod";

export const EvaluationIssueSchema = z.object({
  dimension: z.string().min(1),
  severity: z.enum(["info", "warning", "blocking"]),
  message: z.string().min(1),
});
export type EvaluationIssue = z.infer<typeof EvaluationIssueSchema>;

/** PRODUCT_SPEC §9.2 Stage F — the independent evaluator's scoring dimensions. */
export const PromptQualityScoresSchema = z.object({
  northStarAlignment: z.number().min(0).max(100),
  differenceRealization: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  coherence: z.number().min(0).max(100),
  controllability: z.number().min(0).max(100),
  providerCompatibility: z.number().min(0).max(100),
  hookStrategy: z.number().min(0).max(100),
  repetitionAndMeaning: z.number().min(0).max(100),
  lyricMusicAlignment: z.number().min(0).max(100),
  overloadRisk: z.number().min(0).max(100),
  originalityGuardrails: z.number().min(0).max(100),
});
export type PromptQualityScores = z.infer<typeof PromptQualityScoresSchema>;

export const PromptQualityReportSchema = z.object({
  strategy: z.enum(["safe", "balanced", "bold"]),
  scores: PromptQualityScoresSchema,
  issues: z.array(EvaluationIssueSchema),
  overallNotes: z.string(),
});
export type PromptQualityReport = z.infer<typeof PromptQualityReportSchema>;

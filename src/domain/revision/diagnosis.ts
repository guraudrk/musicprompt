import { z } from "zod";

/**
 * Stub types only. Real Revision Lab diagnosis logic (issue classification, scoped 1-3 control
 * recommendation) is Phase 6 — see IMPLEMENTATION_PLAN.md and PRODUCT_SPEC.md §12.
 */
export const RevisionIssueTypeSchema = z.enum([
  "weak_chorus",
  "boring_verse",
  "flat_emotion",
  "scattered_identity",
  "awkward_lyrics",
]);
export type RevisionIssueType = z.infer<typeof RevisionIssueTypeSchema>;

export const RevisionDiagnosisSchema = z.object({
  issueType: RevisionIssueTypeSchema,
  recommendedLevers: z.array(z.string()),
  scope: z.enum(["local", "section", "global"]),
});
export type RevisionDiagnosis = z.infer<typeof RevisionDiagnosisSchema>;

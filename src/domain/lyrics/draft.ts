import { z } from "zod";

/**
 * Phase 5 (docs/METHODOLOGY.md 김이나/K-pop 작사팀 practice: compare several drafts before
 * committing). A = closest to a plain/direct read, B = one technique layered in, C = fuller use
 * of selected techniques — see src/lyrics/mockLyricsDraftGenerator.ts.
 */
export const LyricsDraftSchema = z.object({
  id: z.string().min(1),
  label: z.enum(["A", "B", "C"]),
  lyrics: z.string().min(1),
  /** Which of spec.lyricsDesign.selectedTechniques this draft actually used — traceability. */
  techniquesUsed: z.array(z.string()),
  notes: z.string(),
});
export type LyricsDraft = z.infer<typeof LyricsDraftSchema>;

export const LyricsDraftSetSchema = z.object({
  drafts: z.array(LyricsDraftSchema).length(3),
});
export type LyricsDraftSet = z.infer<typeof LyricsDraftSetSchema>;

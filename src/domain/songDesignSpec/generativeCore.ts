import { z } from "zod";

export const GenerativeCoreTypeSchema = z.enum([
  "melodic_motif",
  "lyric_line",
  "rhythmic_pattern",
  "chord_movement",
  "image",
  "question_answer",
  "title_rhythm",
]);
export type GenerativeCoreType = z.infer<typeof GenerativeCoreTypeSchema>;

export const GenerativeCoreCandidateSchema = z.object({
  id: z.string().min(1),
  type: GenerativeCoreTypeSchema,
  description: z.string().min(1),
  /** 0-100, relative strength from the hook/core tournament (Methodology principle 4 & 7). */
  strengthScore: z.number().min(0).max(100).optional(),
});
export type GenerativeCoreCandidate = z.infer<typeof GenerativeCoreCandidateSchema>;

export const GenerativeCoreSchema = z.object({
  candidates: z.array(GenerativeCoreCandidateSchema),
  selectedCandidateIds: z.array(z.string()),
  combinedCore: z.string().optional(),
});
export type GenerativeCore = z.infer<typeof GenerativeCoreSchema>;

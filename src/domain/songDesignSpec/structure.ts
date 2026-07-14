import { z } from "zod";

export const DramaticSectionSchema = z.object({
  id: z.string().min(1),
  /** e.g. "Intro", "Verse 1", "Pre-Chorus", "Chorus", "Bridge", "Final Chorus", "Outro". */
  name: z.string().min(1),
  /** e.g. "initiation", "buildup", "arrival", "contrast", "expanded_return". */
  dramaticFunction: z.string().min(1),
  order: z.number().int().min(0),
  energyLevel: z.number().min(0).max(100),
  lengthBars: z.number().int().positive().optional(),
  notes: z.string().optional(),
});
export type DramaticSection = z.infer<typeof DramaticSectionSchema>;

export const EmotionPointSchema = z.object({
  /** 0-100 normalized position along the song timeline. */
  position: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  tension: z.number().min(0).max(100),
  valence: z.number().min(0).max(100).optional(),
});
export type EmotionPoint = z.infer<typeof EmotionPointSchema>;

export const ContrastPlanSchema = z.object({
  dimension: z.string().min(1),
  between: z.tuple([z.string(), z.string()]),
  description: z.string().min(1),
});
export type ContrastPlan = z.infer<typeof ContrastPlanSchema>;

export const HookCandidateSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["melodic", "rhythmic", "lyrical", "harmonic", "sonic"]),
  description: z.string().min(1),
  memorabilityNotes: z.string().optional(),
});
export type HookCandidate = z.infer<typeof HookCandidateSchema>;

export const HookPlanSchema = z.object({
  candidates: z.array(HookCandidateSchema),
  selectedId: z.string().optional(),
  placementSection: z.string().optional(),
});
export type HookPlan = z.infer<typeof HookPlanSchema>;

export const RepetitionPlanSchema = z.object({
  exactRepeats: z.array(z.string()),
  surfaceVariations: z.array(z.string()),
  meaningShifts: z.array(
    z.object({
      line: z.string().min(1),
      firstMeaning: z.string().min(1),
      finalMeaning: z.string().min(1),
    }),
  ),
});
export type RepetitionPlan = z.infer<typeof RepetitionPlanSchema>;

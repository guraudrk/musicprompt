import { z } from "zod";

export const LyricsModeSchema = z.enum([
  "simple_direct",
  "direct",
  "metaphorical",
  "narrative",
  "conversational",
  "image_driven",
  "hybrid",
  "preserve_original",
]);
export type LyricsMode = z.infer<typeof LyricsModeSchema>;

export const KnowHowIntensitySchema = z.enum(["none", "light", "balanced", "deep"]);
export type KnowHowIntensity = z.infer<typeof KnowHowIntensitySchema>;

export const CulturalProfileSchema = z.enum(["kpop", "jpop", "global_pop", "hybrid", "user_defined"]);
export type CulturalProfile = z.infer<typeof CulturalProfileSchema>;

export const LyricsWorkflowStageSchema = z.enum(["theme", "ideation", "draft", "melody_fit", "revision"]);
export type LyricsWorkflowStage = z.infer<typeof LyricsWorkflowStageSchema>;

export const LyricsDesignSpecSchema = z.object({
  mode: LyricsModeSchema,
  /** PRODUCT_SPEC §7.2 / METHODOLOGY 제9-1원칙: direct/simple lyrics are never penalized. */
  knowHowIntensity: KnowHowIntensitySchema,
  selectedTechniques: z.array(z.string()),
  excludedTechniques: z.array(z.string()),
  culturalProfile: CulturalProfileSchema.optional(),
  pointOfView: z.enum(["first", "second", "third"]).optional(),
  speaker: z.string().optional(),
  addressee: z.string().optional(),
  originalLyrics: z.string().optional(),
  /** Locked lines must survive compile and revision unchanged (CLAUDE.md §3). */
  lockedLines: z.array(z.string()),
  workflowStage: LyricsWorkflowStageSchema,
});
export type LyricsDesignSpec = z.infer<typeof LyricsDesignSpecSchema>;

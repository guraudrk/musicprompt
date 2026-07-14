import { z } from "zod";

/** Surface trait: a specific melody, lyric, riff, or timbre. Never carried into output. */
export const ReferenceTraitSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
});
export type ReferenceTrait = z.infer<typeof ReferenceTraitSchema>;

/** Functional principle: an abstracted, reusable songwriting mechanism. May be carried forward. */
export const ReferencePrincipleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  appliesTo: z.array(z.string()).optional(),
});
export type ReferencePrinciple = z.infer<typeof ReferencePrincipleSchema>;

export const ReferenceSchema = z.object({
  songTitle: z.string().optional(),
  artistName: z.string().optional(),
  userReason: z.string().min(1),
  surfaceTraits: z.array(ReferenceTraitSchema),
  functionalPrinciples: z.array(ReferencePrincipleSchema),
  similarityGuardrails: z.array(z.string()),
});
export type Reference = z.infer<typeof ReferenceSchema>;

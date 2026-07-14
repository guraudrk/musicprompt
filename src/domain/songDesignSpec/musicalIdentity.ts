import { z } from "zod";

export const WeightedTagSchema = z.object({
  tag: z.string().min(1),
  weight: z.number().min(0).max(100),
});
export type WeightedTag = z.infer<typeof WeightedTagSchema>;

export const MusicalIdentitySchema = z.object({
  genres: z.array(WeightedTagSchema),
  tempoDescription: z.string().min(1),
  bpmMin: z.number().positive().optional(),
  bpmMax: z.number().positive().optional(),
  keyMode: z.string().optional(),
  timeSignature: z.string().optional(),
  instrumentation: z.array(z.string()),
  vocalDescription: z.string().optional(),
  rhythmicTraits: z.array(z.string()),
  harmonicTraits: z.array(z.string()),
  melodicTraits: z.array(z.string()),
  productionTraits: z.array(z.string()),
});
export type MusicalIdentity = z.infer<typeof MusicalIdentitySchema>;

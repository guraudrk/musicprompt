import { z } from "zod";

export const DeliberateDifferenceDimensionSchema = z.enum([
  "genre",
  "theme",
  "narrator",
  "conflict",
  "ending",
  "vocalDelivery",
  "instrumentation",
  "rhythmicCharacter",
  "hookType",
  "emotionCurve",
  "eraTexture",
  "other",
]);
export type DeliberateDifferenceDimension = z.infer<typeof DeliberateDifferenceDimensionSchema>;

export const DeliberateDifferenceSchema = z.object({
  id: z.string().min(1),
  dimension: DeliberateDifferenceDimensionSchema,
  fromReference: z.string().min(1),
  toNew: z.string().min(1),
});
export type DeliberateDifference = z.infer<typeof DeliberateDifferenceSchema>;

/** PRODUCT_SPEC §5.2: at least three meaningful differences are required once a reference is set. */
export const MINIMUM_DELIBERATE_DIFFERENCES = 3;

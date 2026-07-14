import { z } from "zod";

export const ProvenanceOriginSchema = z.enum([
  "user_provided",
  "inferred_high_confidence",
  "inferred_low_confidence",
  "rule_generated",
  "unknown",
]);
export type ProvenanceOrigin = z.infer<typeof ProvenanceOriginSchema>;

export const FieldProvenanceSchema = z.object({
  fieldPath: z.string().min(1),
  origin: ProvenanceOriginSchema,
  note: z.string().optional(),
});
export type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;

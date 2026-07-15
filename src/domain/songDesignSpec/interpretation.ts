import { z } from "zod";
import { WeightedTagSchema } from "./musicalIdentity";
import { LyricsModeSchema } from "./lyrics";
import { FieldProvenanceSchema } from "@/domain/provenance";

/**
 * Output of a SpecInterpreter (src/spec-interpreter/types.ts): a DRAFT set of musicalIdentity/
 * lyricsDesign suggestions inferred from the user's already-written North Star text, never
 * persisted directly — the user reviews and applies via the existing PATCH /api/projects/{id}
 * (see ProjectEditor.tsx's "AI로 스타일 제안받기" flow). Every suggested field must carry a matching
 * fieldProvenance entry; see validateInterpretation.ts for the deterministic enforcement of that
 * and of "never suggest a value for a field the user already set."
 */
export const SpecInterpretationSchema = z.object({
  musicalIdentity: z.object({
    genres: z.array(WeightedTagSchema).optional(),
    tempoDescription: z.string().min(1).optional(),
    instrumentation: z.array(z.string()).optional(),
    vocalDescription: z.string().min(1).optional(),
  }),
  lyricsDesignMode: LyricsModeSchema.optional(),
  rationale: z.string().min(1),
  fieldProvenance: z.array(FieldProvenanceSchema),
});
export type SpecInterpretation = z.infer<typeof SpecInterpretationSchema>;

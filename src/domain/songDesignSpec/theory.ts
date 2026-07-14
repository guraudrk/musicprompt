import { z } from "zod";

/**
 * These seven engines are named in docs/PRODUCT_SPEC.md §6.1. Real rule logic is Phase 4
 * (see IMPLEMENTATION_PLAN.md); this slice only defines the shape their output takes so the
 * compiler pipeline has a stable Stage B contract to stub against.
 */
export const TheoryEngineNameSchema = z.enum([
  "FormFunctionEngine",
  "MelodyMemoryEngine",
  "HarmonyGravityEngine",
  "RhythmMomentumEngine",
  "ProsodyEngine",
  "ArrangementFormEngine",
  "SubtractionEngine",
]);
export type TheoryEngineName = z.infer<typeof TheoryEngineNameSchema>;

export const TheoryWarningSchema = z.object({
  engine: TheoryEngineNameSchema,
  severity: z.enum(["info", "warning", "blocking"]),
  message: z.string().min(1),
  suggestion: z.string().optional(),
});
export type TheoryWarning = z.infer<typeof TheoryWarningSchema>;

export const CompositionTheorySpecSchema = z.object({
  formNotes: z.string().optional(),
  hookNotes: z.string().optional(),
  prosodyNotes: z.string().optional(),
  tensionReleaseNotes: z.string().optional(),
  repetitionNotes: z.string().optional(),
  motifNotes: z.string().optional(),
  arrangementNotes: z.string().optional(),
  subtractionNotes: z.string().optional(),
  engineWarnings: z.array(TheoryWarningSchema),
});
export type CompositionTheorySpec = z.infer<typeof CompositionTheorySpecSchema>;

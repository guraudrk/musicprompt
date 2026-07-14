import { z } from "zod";

/**
 * These seven engines are named in docs/PRODUCT_SPEC.md §6.1 and implemented in src/theory/
 * (Phase 4, IMPLEMENTATION_PLAN.md). They are deterministic rule checks over the structured text
 * already in SongDesignSpec, not audio/MIDI analysis.
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
  /** Keys ("${engine}:${message}") the user has dismissed — filtered out of future engine runs. */
  dismissedWarnings: z.array(z.string()).default([]),
});
export type CompositionTheorySpec = z.infer<typeof CompositionTheorySpecSchema>;

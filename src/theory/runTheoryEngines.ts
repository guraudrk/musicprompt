import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import { formFunctionEngine } from "./formFunctionEngine";
import { melodyMemoryEngine } from "./melodyMemoryEngine";
import { harmonyGravityEngine } from "./harmonyGravityEngine";
import { rhythmMomentumEngine } from "./rhythmMomentumEngine";
import { prosodyEngine } from "./prosodyEngine";
import { arrangementFormEngine } from "./arrangementFormEngine";
import { subtractionEngine } from "./subtractionEngine";
import type { TheoryEngine, TheoryNotesFields } from "./types";

const ENGINES: TheoryEngine[] = [
  formFunctionEngine,
  melodyMemoryEngine,
  harmonyGravityEngine,
  rhythmMomentumEngine,
  prosodyEngine,
  arrangementFormEngine,
  subtractionEngine,
];

const NOTES_FIELDS = [
  "formNotes",
  "hookNotes",
  "prosodyNotes",
  "tensionReleaseNotes",
  "repetitionNotes",
  "motifNotes",
  "arrangementNotes",
  "subtractionNotes",
] as const satisfies readonly (keyof TheoryNotesFields)[];

/**
 * Runs all 7 theory engines (docs/PRODUCT_SPEC.md §6.1) and combines their output:
 * - Dismissed warnings (by "${engine}:${message}" key) are filtered out.
 * - Notes fields are regenerated fresh each run (this is a computed "current state," not
 *   hand-authored text — there is no notes-editing UI in this slice) UNLESS the field's path
 *   ("compositionTheory.<field>") is in `spec.lockedFields`, in which case the existing stored
 *   value is kept untouched.
 * - When multiple engines contribute to the same notes field (e.g. tensionReleaseNotes from both
 *   HarmonyGravityEngine and RhythmMomentumEngine), their text is combined, not overwritten.
 */
export function runTheoryEngines(spec: SongDesignSpec): CompositionTheorySpec {
  const dismissed = new Set(spec.compositionTheory.dismissedWarnings ?? []);
  const lockedFields = new Set(spec.lockedFields);

  const engineWarnings: CompositionTheorySpec["engineWarnings"] = [];
  const notesAccumulator: Partial<Record<keyof TheoryNotesFields, string[]>> = {};

  for (const engine of ENGINES) {
    const { warnings, notes } = engine(spec);

    for (const warning of warnings) {
      const key = `${warning.engine}:${warning.message}`;
      if (!dismissed.has(key)) engineWarnings.push(warning);
    }

    for (const field of NOTES_FIELDS) {
      const text = notes[field];
      if (!text) continue;
      if (lockedFields.has(`compositionTheory.${field}`)) continue;
      (notesAccumulator[field] ??= []).push(text);
    }
  }

  const notes: TheoryNotesFields = {};
  for (const field of NOTES_FIELDS) {
    const parts = notesAccumulator[field];
    if (parts && parts.length > 0) notes[field] = parts.join(" ");
  }

  const lockedNotes: TheoryNotesFields = {};
  for (const field of NOTES_FIELDS) {
    if (lockedFields.has(`compositionTheory.${field}`)) {
      lockedNotes[field] = spec.compositionTheory[field];
    }
  }

  return {
    ...notes,
    ...lockedNotes,
    engineWarnings,
    dismissedWarnings: [...dismissed],
  };
}

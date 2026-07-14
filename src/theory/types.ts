import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { CompositionTheorySpec, TheoryWarning } from "@/domain/songDesignSpec/theory";

export type TheoryNotesFields = Partial<
  Pick<
    CompositionTheorySpec,
    | "formNotes"
    | "hookNotes"
    | "prosodyNotes"
    | "tensionReleaseNotes"
    | "repetitionNotes"
    | "motifNotes"
    | "arrangementNotes"
    | "subtractionNotes"
  >
>;

export type TheoryEngineOutput = {
  warnings: TheoryWarning[];
  notes: TheoryNotesFields;
};

/** A theory engine is a pure, deterministic function — no audio/MIDI analysis, only checks over
 * the structured text/metadata already present in SongDesignSpec (docs/PRODUCT_SPEC.md §6). */
export type TheoryEngine = (spec: SongDesignSpec) => TheoryEngineOutput;

import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

const MIN_STRUCTURE_LENGTH_FOR_DENSITY_CHECK = 4;
const MIN_PRODUCTION_TRAITS_FOR_LARGE_STRUCTURE = 2;

/** docs/PRODUCT_SPEC.md §6.2 "arrangement density supports the structure"; Methodology 7. 편곡. */
export const arrangementFormEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { musicalIdentity, structure } = spec;

  if (
    structure.length >= MIN_STRUCTURE_LENGTH_FOR_DENSITY_CHECK &&
    musicalIdentity.productionTraits.length < MIN_PRODUCTION_TRAITS_FOR_LARGE_STRUCTURE
  ) {
    warnings.push({
      engine: "ArrangementFormEngine",
      severity: "warning",
      message: "Several sections are planned but few production traits are declared.",
      suggestion: "Note how instrument density/register changes across sections so structure is actually audible (Methodology 7).",
    });
  }

  const finalChorus = structure.find((s) => /final.*chorus|last.*chorus/i.test(s.name));
  const firstChorus = structure.find((s) => /chorus/i.test(s.name) && !/pre-?chorus|final|last/i.test(s.name));
  if (finalChorus && firstChorus && finalChorus !== firstChorus && finalChorus.energyLevel <= firstChorus.energyLevel) {
    warnings.push({
      engine: "ArrangementFormEngine",
      severity: "info",
      message: "The final chorus isn't arranged to feel bigger than the first.",
      suggestion: "Add a layer (harmony vocal, extra instrument) rather than just repeating the same arrangement.",
    });
  }

  const arrangementNotes =
    musicalIdentity.productionTraits.length > 0
      ? `Production traits: ${musicalIdentity.productionTraits.join(", ")}.`
      : "No production/arrangement traits declared yet.";

  return { warnings, notes: { arrangementNotes } };
};

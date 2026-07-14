import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

const MAX_REASONABLE_GENRES = 3;
const MAX_REASONABLE_INSTRUMENTS = 6;
const MAX_REASONABLE_HOOK_CANDIDATES = 8;

/** docs/PRODUCT_SPEC.md §6.2 "unnecessary ideas are identified for removal"; Methodology 제9/제13원칙. */
export const subtractionEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { musicalIdentity, hookPlan, exclusions } = spec;

  if (musicalIdentity.genres.length > MAX_REASONABLE_GENRES) {
    warnings.push({
      engine: "SubtractionEngine",
      severity: "warning",
      message: `${musicalIdentity.genres.length} genres declared — mixing this many can blur identity.`,
      suggestion: "Keep 1-3 genre tags; fold the rest into production traits instead (Methodology 제9원칙).",
    });
  }

  if (musicalIdentity.instrumentation.length > MAX_REASONABLE_INSTRUMENTS) {
    warnings.push({
      engine: "SubtractionEngine",
      severity: "info",
      message: `${musicalIdentity.instrumentation.length} instruments listed — consider whether all of them serve the hook.`,
      suggestion: "Cut instruments that don't support the vocal or the hook.",
    });
  }

  if (hookPlan.candidates.length > MAX_REASONABLE_HOOK_CANDIDATES) {
    warnings.push({
      engine: "SubtractionEngine",
      severity: "info",
      message: `${hookPlan.candidates.length} hook candidates recorded — narrow the tournament before compiling.`,
    });
  }

  const conflicting = musicalIdentity.instrumentation.filter((instrument) =>
    exclusions.some((excluded) => excluded.toLowerCase() === instrument.toLowerCase()),
  );
  if (conflicting.length > 0) {
    warnings.push({
      engine: "SubtractionEngine",
      severity: "warning",
      message: `"${conflicting.join(", ")}" is both requested and excluded.`,
      suggestion: "Remove the contradiction from either instrumentation or exclusions.",
    });
  }

  const subtractionNotes =
    warnings.length > 0 ? "Potential overload flagged — see warnings for specifics." : "No overload signals detected at the current level of detail.";

  return { warnings, notes: { subtractionNotes } };
};

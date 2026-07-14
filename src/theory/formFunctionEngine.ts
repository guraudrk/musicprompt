import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

const ENERGY_CONTRAST_THRESHOLD = 15;

/**
 * docs/PRODUCT_SPEC.md §6.2: "each section has a dramatic function," "verse and chorus are
 * audibly different," "pre-chorus creates a reason for the chorus," "final chorus differs
 * meaningfully from the first." Checks are over declared section names/energy levels, not audio.
 */
export const formFunctionEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { structure, repetitionPlan } = spec;

  for (const section of structure) {
    if (!section.dramaticFunction.trim()) {
      warnings.push({
        engine: "FormFunctionEngine",
        severity: "warning",
        message: `Section "${section.name}" has no dramatic function.`,
        suggestion:
          "Describe what this section does for the listener (e.g. initiation, buildup, arrival, contrast, expanded_return).",
      });
    }
  }

  const verse = structure.find((s) => /verse/i.test(s.name));
  const choruses = structure.filter((s) => /chorus/i.test(s.name) && !/pre-?chorus/i.test(s.name));
  const preChorus = structure.find((s) => /pre-?chorus/i.test(s.name));
  const firstChorus = choruses[0];
  const lastChorus = choruses[choruses.length - 1];

  if (verse && firstChorus && Math.abs(firstChorus.energyLevel - verse.energyLevel) < ENERGY_CONTRAST_THRESHOLD) {
    warnings.push({
      engine: "FormFunctionEngine",
      severity: "warning",
      message: "Verse and chorus energy levels are too close to read as contrasting.",
      suggestion: "Widen the energy gap, or add another contrast dimension (register, density, rhythm).",
    });
  }

  if (preChorus && verse && firstChorus) {
    const risesTowardChorus = preChorus.energyLevel > verse.energyLevel && preChorus.energyLevel < firstChorus.energyLevel;
    if (!risesTowardChorus) {
      warnings.push({
        engine: "FormFunctionEngine",
        severity: "warning",
        message: "Pre-chorus energy doesn't sit between the verse and the chorus.",
        suggestion:
          "Raise the pre-chorus above the verse but keep it below the chorus so it reads as a buildup, not its own destination.",
      });
    }
  }

  if (choruses.length >= 2 && firstChorus !== lastChorus) {
    const meaningShifts = repetitionPlan.meaningShifts.length > 0;
    const expandsEnergy = lastChorus.energyLevel > firstChorus.energyLevel;
    if (!meaningShifts && !expandsEnergy) {
      warnings.push({
        engine: "FormFunctionEngine",
        severity: "info",
        message: "The final chorus doesn't clearly differ from the first chorus.",
        suggestion:
          "Expand its energy, or give its core line a new meaning (repetitionPlan.meaningShifts) — Methodology 제8원칙.",
      });
    }
  }

  const formNotes = `Sections: ${structure.map((s) => `${s.name} (${s.dramaticFunction || "unlabeled"})`).join(" -> ") || "none declared yet"}.`;
  const repetitionNotes =
    repetitionPlan.meaningShifts.length > 0
      ? `${repetitionPlan.meaningShifts.length} line(s) planned to shift meaning across repeats.`
      : "No planned meaning shifts for repeated lines yet.";

  return { warnings, notes: { formNotes, repetitionNotes } };
};

import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

/**
 * docs/PRODUCT_SPEC.md §6.2 "highest note has a purpose"; Methodology 제4/제7원칙 (generative core,
 * hook tournament). Approximated via declared hook/core selection and emotion-curve peak, since
 * there is no literal pitch data without audio.
 */
export const melodyMemoryEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { hookPlan, generativeCore, emotionCurve } = spec;

  if (hookPlan.candidates.length < 2) {
    warnings.push({
      engine: "MelodyMemoryEngine",
      severity: "info",
      message: "Only one hook candidate has been recorded.",
      suggestion: "Sketch a few more hook candidates and compare them before committing (Methodology 제7원칙).",
    });
  }

  const selectedHook = hookPlan.candidates.find((h) => h.id === hookPlan.selectedId);
  if (hookPlan.candidates.length > 0 && !selectedHook) {
    warnings.push({
      engine: "MelodyMemoryEngine",
      severity: "warning",
      message: "No hook candidate has been selected yet.",
      suggestion: "Choose the strongest candidate from hookPlan.candidates.",
    });
  }
  if (selectedHook && !selectedHook.memorabilityNotes?.trim()) {
    warnings.push({
      engine: "MelodyMemoryEngine",
      severity: "info",
      message: `The selected hook ("${selectedHook.description}") has no memorability notes.`,
      suggestion: "Note why this hook is easy to remember and repeat with variation.",
    });
  }

  if (generativeCore.candidates.length > 0 && generativeCore.selectedCandidateIds.length === 0) {
    warnings.push({
      engine: "MelodyMemoryEngine",
      severity: "warning",
      message: "No generative core candidate has been selected.",
      suggestion: "Pick the strongest generative core so it can grow into the full song (Methodology 제4원칙).",
    });
  }

  const peak = emotionCurve.reduce<(typeof emotionCurve)[number] | undefined>(
    (max, p) => (p.energy > (max?.energy ?? -1) ? p : max),
    undefined,
  );
  if (peak && !hookPlan.placementSection) {
    warnings.push({
      engine: "MelodyMemoryEngine",
      severity: "info",
      message: "The emotional peak isn't tied to a specific section for the hook.",
      suggestion: "Set hookPlan.placementSection so the highest note/peak has a clear location and purpose.",
    });
  }

  const motifNotes = generativeCore.combinedCore
    ? `Generative core: ${generativeCore.combinedCore}`
    : `${generativeCore.candidates.length} generative core candidate(s), none combined yet.`;
  const hookNotes = selectedHook
    ? `Selected hook (${selectedHook.type}): ${selectedHook.description}`
    : `${hookPlan.candidates.length} hook candidate(s), none selected yet.`;

  return { warnings, notes: { motifNotes, hookNotes } };
};

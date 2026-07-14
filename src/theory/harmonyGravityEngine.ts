import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

/** docs/METHODOLOGY.md 화성 sections (tonic/predominant/dominant, modal interchange). */
export const harmonyGravityEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { musicalIdentity, contrastPlan } = spec;

  if (musicalIdentity.harmonicTraits.length === 0) {
    warnings.push({
      engine: "HarmonyGravityEngine",
      severity: "info",
      message: "No harmonic traits declared.",
      suggestion:
        "Note the harmonic flow you want (e.g. stable verse, secondary dominant into the chorus, modal interchange in the bridge) — Methodology 제5원칙.",
    });
  }

  if (!musicalIdentity.keyMode) {
    warnings.push({
      engine: "HarmonyGravityEngine",
      severity: "info",
      message: "No key/mode declared.",
      suggestion: "Even a rough brightness/darkness intent (major/minor, modal color) helps the compiler stay consistent.",
    });
  }

  const hasHarmonicContrast = contrastPlan.some((c) => /harmon|chord|key/i.test(c.dimension));
  if (musicalIdentity.harmonicTraits.length > 0 && !hasHarmonicContrast) {
    warnings.push({
      engine: "HarmonyGravityEngine",
      severity: "info",
      message: "Harmonic traits are declared but no contrastPlan entry uses harmony as a dimension.",
      suggestion: "Consider whether a harmonic contrast (e.g. tense verse vs. resolved chorus) would strengthen the design.",
    });
  }

  const tensionReleaseNotes =
    musicalIdentity.harmonicTraits.length > 0
      ? `Harmonic traits: ${musicalIdentity.harmonicTraits.join(", ")}.`
      : undefined;

  return { warnings, notes: { tensionReleaseNotes } };
};

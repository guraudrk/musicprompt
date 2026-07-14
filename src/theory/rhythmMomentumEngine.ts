import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

/** docs/PRODUCT_SPEC.md §6.2 "silence is considered as an active rhythmic choice"; Methodology 제6/제10원칙. */
export const rhythmMomentumEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { musicalIdentity, contrastPlan } = spec;

  if (musicalIdentity.rhythmicTraits.length === 0) {
    warnings.push({
      engine: "RhythmMomentumEngine",
      severity: "info",
      message: "No rhythmic traits declared.",
      suggestion: "Note the groove, syncopation, or phrase-length choices that push the song forward (Methodology 제6원칙).",
    });
  }

  const mentionsSilence = [...musicalIdentity.rhythmicTraits, ...contrastPlan.map((c) => c.description)].some((text) =>
    /silence|space|rest|pause|empty/i.test(text),
  );

  if (!mentionsSilence) {
    warnings.push({
      engine: "RhythmMomentumEngine",
      severity: "info",
      message: "Silence isn't mentioned as a deliberate rhythmic choice anywhere.",
      suggestion: "Consider whether a beat or bar of silence before the chorus could increase impact (Methodology 제10원칙).",
    });
  }

  if (!musicalIdentity.bpmMin && !musicalIdentity.bpmMax && !musicalIdentity.tempoDescription.trim()) {
    warnings.push({
      engine: "RhythmMomentumEngine",
      severity: "warning",
      message: "No tempo or BPM range declared.",
      suggestion: "Even a rough tempo feel (e.g. 'unhurried mid-tempo') keeps momentum decisions consistent across providers.",
    });
  }

  const tensionReleaseNotes = mentionsSilence
    ? "Silence/space is used deliberately as part of the rhythmic design."
    : undefined;

  return { warnings, notes: { tensionReleaseNotes } };
};

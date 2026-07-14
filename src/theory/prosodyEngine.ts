import type { TheoryWarning } from "@/domain/songDesignSpec/theory";
import type { TheoryEngine } from "./types";

/**
 * docs/PRODUCT_SPEC.md §6.2 "important lyric stress aligns with musical stress unless
 * intentionally contrasted." Without audio/melody data this can't be verified exactly, so this
 * engine gives explainable reminders rather than a fake precise check (IMPLEMENTATION_PLAN.md
 * Phase 4: "do not pretend to perform exact audio analysis without audio").
 */
export const prosodyEngine: TheoryEngine = (spec) => {
  const warnings: TheoryWarning[] = [];
  const { lyricsDesign, identity } = spec;

  if (lyricsDesign.lockedLines.length > 0) {
    warnings.push({
      engine: "ProsodyEngine",
      severity: "info",
      message: `${lyricsDesign.lockedLines.length} locked line(s) — verify their stress and syllable count fit the melody once one exists.`,
      suggestion: "Read locked lines aloud against the intended rhythm; adjust word choice, not the locked meaning, if a syllable lands awkwardly.",
    });
  }

  if (lyricsDesign.mode !== "preserve_original" && !lyricsDesign.originalLyrics?.trim()) {
    warnings.push({
      engine: "ProsodyEngine",
      severity: "info",
      message: "No lyric draft yet, so word-stress vs. musical-stress alignment can't be checked.",
      suggestion: "Once a draft exists, put the most important word of each line on the strongest beat or longest note.",
    });
  }

  const language = identity.language.trim().toLowerCase();
  if (language === "korean" || language === "japanese") {
    warnings.push({
      engine: "ProsodyEngine",
      severity: "info",
      message: `Language is ${identity.language} — check particle/ending stress (Korean) or mora/long-vowel placement (Japanese) against the melody.`,
    });
  }

  const prosodyNotes =
    lyricsDesign.mode === "direct" || lyricsDesign.mode === "simple_direct"
      ? "Direct/simple mode: prioritize natural pronunciation and singability over metaphor density (CLAUDE.md §3, Methodology 제9-1원칙)."
      : `Lyrics mode: ${lyricsDesign.mode}.`;

  return { warnings, notes: { prosodyNotes } };
};

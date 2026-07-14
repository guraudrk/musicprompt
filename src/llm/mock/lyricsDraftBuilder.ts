import type { LyricsDraftInput } from "@/lyrics/types";
import type { LyricsDraftSet } from "@/domain/lyrics/draft";

const DIRECT_MODES = new Set(["direct", "simple_direct"]);

/**
 * Stage-equivalent Mock builder for lyrics drafting (Phase 5). Deterministic: never applies a
 * technique in direct/simple_direct mode, never uses an excluded technique, always reproduces
 * every locked line verbatim, and reports exactly which techniques each draft used.
 */
export function buildLyricsDraftSet(input: LyricsDraftInput): LyricsDraftSet {
  const { spec } = input;
  const { lyricsDesign, northStar, generativeCore } = spec;

  const allowTechniques = !DIRECT_MODES.has(lyricsDesign.mode) && lyricsDesign.knowHowIntensity !== "none";
  const availableTechniques = lyricsDesign.selectedTechniques.filter(
    (t) => !lyricsDesign.excludedTechniques.includes(t),
  );

  const coreLine = generativeCore.combinedCore ?? lyricsDesign.lockedLines[0] ?? northStar.audienceExperience;

  const variants: { label: "A" | "B" | "C"; techniqueCount: number; notes: string }[] = [
    { label: "A", techniqueCount: 0, notes: "Safe: closest to a plain, direct read." },
    {
      label: "B",
      techniqueCount: allowTechniques ? Math.min(1, availableTechniques.length) : 0,
      notes: "Balanced: one additional technique layered in.",
    },
    {
      label: "C",
      techniqueCount: allowTechniques ? availableTechniques.length : 0,
      notes: "Bold: fuller use of the selected techniques.",
    },
  ];

  const drafts = variants.map(({ label, techniqueCount, notes }) => {
    const techniquesUsed = availableTechniques.slice(0, techniqueCount);
    const bodyLine =
      label === "A"
        ? `A direct line about ${northStar.nonNegotiableCore}`
        : label === "B"
          ? `A line connecting "${northStar.audienceExperience}" to "${coreLine}"`
          : `A bolder reframing of "${northStar.finalAftertaste}"${
              techniquesUsed.length > 0 ? ` using ${techniquesUsed.join(", ")}` : ""
            }`;

    const lines = [...lyricsDesign.lockedLines, bodyLine];

    return {
      id: `draft-${label.toLowerCase()}`,
      label,
      lyrics: lines.join("\n"),
      techniquesUsed,
      notes,
    };
  });

  return { drafts };
}

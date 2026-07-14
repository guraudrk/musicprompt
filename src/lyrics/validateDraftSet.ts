import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { LyricsDraftSet } from "@/domain/lyrics/draft";

const DIRECT_MODES = new Set(["direct", "simple_direct"]);

/**
 * Deterministic backstop for the Definition of Done (IMPLEMENTATION_PLAN.md Phase 5): this is
 * what makes "direct mode does not inject metaphor," "selected techniques are traceable,"
 * "excluded techniques do not appear," and "locked lines survive" real guarantees rather than
 * prompt-instruction hope — applies to both Mock and Gemini output equally.
 *
 * The "techniquesUsed must be a subset of selectedTechniques" check was added after live testing
 * against real Gemini output: the model reported technique names the user never selected (e.g.
 * "직관적 대조" when only "공감각적 비유" was selected) — traceability requires the reported list to
 * only ever contain techniques the user actually chose, not ones the model invented on its own.
 */
export function validateLyricsDraftSet(
  spec: SongDesignSpec,
  draftSet: LyricsDraftSet,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const { lyricsDesign } = spec;
  const isDirectMode = DIRECT_MODES.has(lyricsDesign.mode);

  for (const draft of draftSet.drafts) {
    for (const line of lyricsDesign.lockedLines) {
      if (!draft.lyrics.includes(line)) {
        errors.push(`Draft ${draft.label}: locked line was not preserved verbatim: "${line}"`);
      }
    }

    for (const technique of draft.techniquesUsed) {
      if (lyricsDesign.excludedTechniques.includes(technique)) {
        errors.push(`Draft ${draft.label}: used excluded technique "${technique}".`);
      }
      if (!lyricsDesign.selectedTechniques.includes(technique)) {
        errors.push(`Draft ${draft.label}: reported technique "${technique}" was never selected by the user.`);
      }
    }

    if (isDirectMode && draft.techniquesUsed.length > 0) {
      errors.push(
        `Draft ${draft.label}: direct/simple mode must not use any technique, but used ${draft.techniquesUsed.join(", ")}.`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

import type { SpecInterpretInput } from "@/spec-interpreter/types";
import type { SpecInterpretation } from "@/domain/songDesignSpec/interpretation";
import type { FieldProvenance } from "@/domain/provenance";
import { extractHints } from "@/domain/songDesignSpec/extractHints";

const METAPHOR_MODE_KEYWORDS = /은유|metaphor|metaphorical|메타포/i;
const DIRECT_MODE_KEYWORDS = /직설|직접적|simple|plain|direct/i;

/**
 * Deterministic Mock builder for spec interpretation (ADR-044). Reuses the same non-AI keyword
 * matching as the anonymous demo (extractHints) so both stay honest about being "keyword matching,
 * not classification" — the real semantic lifting for vague/messy input is Gemini's job
 * (geminiSpecInterpreter.ts), not this Mock's. Never suggests a value for a field the spec already
 * has a non-default value for (see validateInterpretation.ts for the deterministic backstop that
 * also applies to Gemini's output).
 */
export function buildSpecInterpretation(input: SpecInterpretInput): SpecInterpretation {
  const { spec } = input;
  const northStarText = [
    spec.northStar.audienceExperience,
    spec.northStar.finalAftertaste,
    spec.northStar.nonNegotiableCore,
  ].join(" ");

  const hints = extractHints(northStarText);
  const fieldProvenance: FieldProvenance[] = [];
  const musicalIdentity: SpecInterpretation["musicalIdentity"] = {};

  if (spec.musicalIdentity.genres.length === 0 && hints.genres.length > 0) {
    musicalIdentity.genres = hints.genres.map((tag) => ({ tag, weight: 50 }));
    fieldProvenance.push({
      fieldPath: "musicalIdentity.genres",
      origin: "inferred_low_confidence",
      note: "Deterministic keyword match against the North Star text.",
    });
  }

  if (spec.musicalIdentity.tempoDescription === "unspecified" && hints.tempo) {
    musicalIdentity.tempoDescription = hints.tempo;
    fieldProvenance.push({
      fieldPath: "musicalIdentity.tempoDescription",
      origin: "inferred_low_confidence",
      note: "Deterministic keyword match against the North Star text.",
    });
  }

  if (spec.musicalIdentity.instrumentation.length === 0 && hints.vocal) {
    musicalIdentity.instrumentation = [hints.vocal];
    fieldProvenance.push({
      fieldPath: "musicalIdentity.instrumentation",
      origin: "inferred_low_confidence",
      note: "Deterministic keyword match against the North Star text.",
    });
  }

  let lyricsDesignMode: SpecInterpretation["lyricsDesignMode"];
  if (spec.lyricsDesign.mode === "direct") {
    if (METAPHOR_MODE_KEYWORDS.test(northStarText)) {
      lyricsDesignMode = "metaphorical";
    } else if (DIRECT_MODE_KEYWORDS.test(northStarText)) {
      lyricsDesignMode = "direct";
    }
    if (lyricsDesignMode) {
      fieldProvenance.push({
        fieldPath: "lyricsDesign.mode",
        origin: "inferred_low_confidence",
        note: "Deterministic keyword match against the North Star text.",
      });
    }
  }

  const rationale =
    fieldProvenance.length > 0
      ? "Suggested from keyword matches found in your North Star text (deterministic Mock match)."
      : "No confident genre/tempo/instrumentation/lyrics-mode cues found in your North Star text — try adding more specific descriptive words, or sign up to use Gemini's fuller interpretation.";

  return { musicalIdentity, lyricsDesignMode, rationale, fieldProvenance };
}

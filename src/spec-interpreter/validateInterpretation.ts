import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { SpecInterpretation } from "@/domain/songDesignSpec/interpretation";

/**
 * Deterministic backstop for the "never override a user-confirmed field" and "every suggestion is
 * traceable" rules from spec-interpret.system.md — applies equally to Mock and Gemini output,
 * matching the project's existing pattern (src/lyrics/validateDraftSet.ts). Drops (rather than
 * rejects the whole response) any suggested field that either collides with a non-default value
 * already in the spec, or is missing a matching fieldProvenance entry — an untraceable suggestion
 * is worse than no suggestion.
 */
export function validateInterpretation(spec: SongDesignSpec, interpretation: SpecInterpretation): SpecInterpretation {
  const provenancePaths = new Set(interpretation.fieldProvenance.map((entry) => entry.fieldPath));
  const acceptedPaths = new Set<string>();
  const musicalIdentity: SpecInterpretation["musicalIdentity"] = {};

  function accept(path: string, isEmptyInSpec: boolean, apply: () => void) {
    if (isEmptyInSpec && provenancePaths.has(path)) {
      apply();
      acceptedPaths.add(path);
    }
  }

  accept(
    "musicalIdentity.genres",
    !!interpretation.musicalIdentity.genres?.length && spec.musicalIdentity.genres.length === 0,
    () => {
      musicalIdentity.genres = interpretation.musicalIdentity.genres;
    },
  );

  accept(
    "musicalIdentity.tempoDescription",
    !!interpretation.musicalIdentity.tempoDescription && spec.musicalIdentity.tempoDescription === "unspecified",
    () => {
      musicalIdentity.tempoDescription = interpretation.musicalIdentity.tempoDescription;
    },
  );

  accept(
    "musicalIdentity.instrumentation",
    !!interpretation.musicalIdentity.instrumentation?.length && spec.musicalIdentity.instrumentation.length === 0,
    () => {
      musicalIdentity.instrumentation = interpretation.musicalIdentity.instrumentation;
    },
  );

  accept(
    "musicalIdentity.vocalDescription",
    !!interpretation.musicalIdentity.vocalDescription && !spec.musicalIdentity.vocalDescription,
    () => {
      musicalIdentity.vocalDescription = interpretation.musicalIdentity.vocalDescription;
    },
  );

  let lyricsDesignMode: SpecInterpretation["lyricsDesignMode"];
  accept("lyricsDesign.mode", !!interpretation.lyricsDesignMode && spec.lyricsDesign.mode === "direct", () => {
    lyricsDesignMode = interpretation.lyricsDesignMode;
  });

  const fieldProvenance = interpretation.fieldProvenance.filter((entry) => acceptedPaths.has(entry.fieldPath));

  return {
    musicalIdentity,
    lyricsDesignMode,
    rationale: interpretation.rationale,
    fieldProvenance,
  };
}

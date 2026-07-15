import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { CompilerOutput } from "@/domain/promptPackage/schema";

function warningKey(entry: { engine: string; message: string }): string {
  return `${entry.engine}:${entry.message}`;
}

/**
 * Deterministic backstop making theory-engine warnings genuinely load-bearing in the compiled
 * output, rather than inert context Gemini can silently ignore — mirrors the exact
 * self-reported-list-checked-against-ground-truth shape already proven for
 * `LyricsDraft.techniquesUsed` (src/lyrics/validateDraftSet.ts). Applies equally to Mock and
 * Gemini output. `theorySummary` here is already dismissal-filtered by runTheoryEngines(), so
 * every entry in it is something this compile could account for.
 *
 * Only `"warning"`/`"blocking"` severity entries are *required* to have a matching addressal.
 * `"info"`-severity entries (the large majority in practice — minor stylistic suggestions like "no
 * key/mode declared") are optional context, not mandatory — live-verified (ADR-045) that requiring
 * every single warning, including every minor info-level one, made real Gemini responses slow
 * enough to trip the request timeout on a meaningful fraction of compiles. Restricting the hard
 * requirement to genuinely substantive issues keeps the enforcement real without that cost.
 */
export function validateTheoryAddressal(
  theorySummary: CompositionTheorySpec,
  pkg: CompilerOutput,
): string[] {
  const errors: string[] = [];
  const requiredWarnings = theorySummary.engineWarnings.filter(
    (w) => w.severity === "warning" || w.severity === "blocking",
  );
  const warningKeys = new Set(theorySummary.engineWarnings.map(warningKey));
  const addressedKeys = new Set(pkg.theoryAddressal.map(warningKey));

  for (const warning of requiredWarnings) {
    if (!addressedKeys.has(warningKey(warning))) {
      errors.push(`Theory warning from ${warning.engine} was not addressed: "${warning.message}"`);
    }
  }

  for (const addressal of pkg.theoryAddressal) {
    if (!warningKeys.has(warningKey(addressal))) {
      errors.push(
        `theoryAddressal references a warning that was never raised: ${addressal.engine}: "${addressal.message}"`,
      );
    }
  }

  return errors;
}

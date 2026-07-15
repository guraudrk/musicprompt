import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { ProviderCapabilityProfile } from "@/domain/providerCapability/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { ProviderRegistry } from "@/providers/registry";
import type { PromptCompiler, PromptEvaluator, ProviderCompilerInput, CompilerMetadata } from "./types";
import { MusicAIPromptPackageSchema, SCHEMA_VERSION, type MusicAIPromptPackage, type Strategy } from "@/domain/promptPackage/schema";
import { runTheoryEngines } from "@/theory/runTheoryEngines";
import { validateTheoryAddressal } from "./validateTheoryAddressal";

export type CompilePipelineDeps = {
  registry: ProviderRegistry;
  compiler: PromptCompiler;
  evaluator: PromptEvaluator;
};

export type CompilePipelineResult = {
  package: MusicAIPromptPackage;
  repaired: boolean;
  metadata: CompilerMetadata & { schemaVersion: string; latencyMs: number; repairCount: number };
};

function validatePackage(
  spec: SongDesignSpec,
  provider: ProviderCapabilityProfile,
  theorySummary: CompositionTheorySpec,
  pkg: MusicAIPromptPackage,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // Stage E: schema validity.
  const parsed = MusicAIPromptPackageSchema.safeParse(pkg);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
  }

  // Stage E: locked lyric lines must survive compile (CLAUDE.md §3, PRODUCT_SPEC §9.2 Stage E).
  for (const line of spec.lyricsDesign.lockedLines) {
    if (!(pkg.fields.lyrics ?? "").includes(line)) {
      errors.push(`Locked lyric line was not preserved: "${line}"`);
    }
  }

  // Stage E: required provider fields must be present.
  const fields = pkg.fields as Record<string, unknown>;
  for (const requiredField of provider.promptSchema.requiredFields) {
    const value = fields[requiredField];
    if (value === undefined || value === null || value === "") {
      errors.push(`Required field "${requiredField}" for provider "${provider.providerId}" is missing.`);
    }
  }

  // Stage E: every active theory-engine warning must be genuinely addressed, not silently ignored.
  if (parsed.success) {
    errors.push(...validateTheoryAddressal(theorySummary, pkg));
  }

  return { ok: errors.length === 0, errors };
}

const FALLBACK_METADATA: CompilerMetadata = { model: "unknown", apiMode: "unknown", promptTemplateVersion: "unknown" };

/**
 * Orchestrates PRODUCT_SPEC.md §9.2 Stage C through H for one provider + strategy. Stage A
 * (normalization) is assumed to have already produced `spec`. Stage B (theory enrichment) runs the
 * 7 deterministic theory engines (Phase 4, src/theory/) — dismissed warnings are filtered and
 * locked notes fields are preserved before the result ever reaches the compiler.
 */
export async function compilePromptPackage(
  spec: SongDesignSpec,
  providerId: string,
  strategy: Strategy,
  deps: CompilePipelineDeps,
): Promise<CompilePipelineResult> {
  // Stage C: provider projection.
  const provider = deps.registry.get(providerId);
  if (!provider) {
    throw new Error(`Unknown provider "${providerId}".`);
  }

  // Stage B: theory enrichment.
  const theorySummary = runTheoryEngines(spec);

  const compilerInput: ProviderCompilerInput = {
    spec,
    provider,
    strategy,
    theorySummary,
  };

  const startedAt = Date.now();

  // Stage D: Gemini (or Mock) structured compiler.
  let pkg = await deps.compiler.compile(compilerInput);

  // Stage E: deterministic validation.
  let validation = validatePackage(spec, provider, theorySummary, pkg);
  let repaired = false;

  if (!validation.ok) {
    // Stage G: single automatic repair pass (ADR-010), only reached on a blocking error.
    pkg = await deps.compiler.repair({
      originalInput: compilerInput,
      invalidOutput: pkg,
      validationErrors: validation.errors,
    });
    repaired = true;

    validation = validatePackage(spec, provider, theorySummary, pkg);
    if (!validation.ok) {
      throw new Error(
        `Prompt package still fails validation after the single repair pass: ${validation.errors.join("; ")}`,
      );
    }
  }

  // Stage F: independent evaluator (separate schema/instruction from the compiler — ADR-009).
  const quality = await deps.evaluator.evaluate({ spec, package: pkg });
  const finalPackage: MusicAIPromptPackage = { ...pkg, promptQuality: quality };
  const latencyMs = Date.now() - startedAt;

  // Stage H: final package assembly.
  return {
    package: MusicAIPromptPackageSchema.parse(finalPackage),
    repaired,
    metadata: {
      ...(deps.compiler.metadata ?? FALLBACK_METADATA),
      schemaVersion: SCHEMA_VERSION,
      latencyMs,
      repairCount: repaired ? 1 : 0,
    },
  };
}

/** Compiles Safe, Balanced, and Bold in parallel for one provider (PRODUCT_SPEC.md §11). */
export async function compileAllStrategies(
  spec: SongDesignSpec,
  providerId: string,
  deps: CompilePipelineDeps,
): Promise<Record<Strategy, CompilePipelineResult>> {
  const [safe, balanced, bold] = await Promise.all([
    compilePromptPackage(spec, providerId, "safe", deps),
    compilePromptPackage(spec, providerId, "balanced", deps),
    compilePromptPackage(spec, providerId, "bold", deps),
  ]);
  return { safe, balanced, bold };
}

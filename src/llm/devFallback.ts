import type { PromptCompiler, PromptEvaluator, ProviderCompilerInput, PromptRepairInput, PromptEvaluationInput } from "@/compiler/types";
import type { LyricsDraftGenerator, LyricsDraftInput } from "@/lyrics/types";

/**
 * Wraps a real (Gemini) compiler/evaluator so that in development, a failure falls back to the
 * deterministic Mock instead of breaking local work (IMPLEMENTATION_PLAN.md §3.7 "Mock fallback in
 * development only"). In production, the real error is rethrown — no silent fallback.
 *
 * `metadata` is mutated to reflect whichever backend actually served the *last* call — live
 * testing (docs/PHASE_LOG.md Phase 3 entry) caught an earlier version of this that always reported
 * the real compiler's metadata even on calls that silently fell back to Mock, which would have
 * mislabeled Mock-produced packages as Gemini output in persisted metadata.
 */
export function wrapCompilerWithDevFallback(real: PromptCompiler, mock: PromptCompiler): PromptCompiler {
  const wrapper: PromptCompiler = {
    metadata: real.metadata,
    async compile(input: ProviderCompilerInput) {
      try {
        const result = await real.compile(input);
        wrapper.metadata = real.metadata;
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "production") throw error;
        console.warn(
          `[GeminiPromptCompiler] compile failed, falling back to Mock in development: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        wrapper.metadata = mock.metadata;
        return mock.compile(input);
      }
    },
    async repair(input: PromptRepairInput) {
      try {
        const result = await real.repair(input);
        wrapper.metadata = real.metadata;
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "production") throw error;
        console.warn(
          `[GeminiPromptCompiler] repair failed, falling back to Mock in development: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        wrapper.metadata = mock.metadata;
        return mock.repair(input);
      }
    },
  };
  return wrapper;
}

export function wrapEvaluatorWithDevFallback(real: PromptEvaluator, mock: PromptEvaluator): PromptEvaluator {
  const wrapper: PromptEvaluator = {
    metadata: real.metadata,
    async evaluate(input: PromptEvaluationInput) {
      try {
        const result = await real.evaluate(input);
        wrapper.metadata = real.metadata;
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "production") throw error;
        console.warn(
          `[GeminiPromptEvaluator] evaluate failed, falling back to Mock in development: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        wrapper.metadata = mock.metadata;
        return mock.evaluate(input);
      }
    },
  };
  return wrapper;
}

export function wrapLyricsDraftGeneratorWithDevFallback(
  real: LyricsDraftGenerator,
  mock: LyricsDraftGenerator,
): LyricsDraftGenerator {
  const wrapper: LyricsDraftGenerator = {
    metadata: real.metadata,
    async draft(input: LyricsDraftInput) {
      try {
        const result = await real.draft(input);
        wrapper.metadata = real.metadata;
        return result;
      } catch (error) {
        if (process.env.NODE_ENV === "production") throw error;
        console.warn(
          `[GeminiLyricsDraftGenerator] draft failed, falling back to Mock in development: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        wrapper.metadata = mock.metadata;
        return mock.draft(input);
      }
    },
  };
  return wrapper;
}

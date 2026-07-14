import "server-only";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { MockPromptCompiler } from "@/llm/mock/mockPromptCompiler";
import { MockPromptEvaluator } from "@/llm/mock/mockPromptEvaluator";
import type { CompilePipelineDeps } from "@/compiler/pipeline";

/**
 * Mock-first (ADR-011): the API routes compile through the deterministic Mock pipeline.
 * GeminiPromptCompiler/Evaluator stay server-only skeletons until Phase 3's live SDK wiring.
 */
export const compilePipelineDeps: CompilePipelineDeps = {
  registry: new InMemoryProviderRegistry(),
  compiler: new MockPromptCompiler(),
  evaluator: new MockPromptEvaluator(),
};

import "server-only";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { MockPromptCompiler } from "@/llm/mock/mockPromptCompiler";
import { MockPromptEvaluator } from "@/llm/mock/mockPromptEvaluator";
import { GeminiPromptCompiler } from "@/llm/gemini/geminiPromptCompiler";
import { GeminiPromptEvaluator } from "@/llm/gemini/geminiPromptEvaluator";
import { wrapCompilerWithDevFallback, wrapEvaluatorWithDevFallback } from "@/llm/devFallback";
import { isGeminiConfigured } from "@/lib/env";
import type { CompilePipelineDeps } from "@/compiler/pipeline";

const mockCompiler = new MockPromptCompiler();
const mockEvaluator = new MockPromptEvaluator();

/**
 * Gemini is used when properly configured (ADR-029); development gets a Mock fallback on
 * failure, production surfaces the real error. Without a configured key (e.g. CI), this falls
 * back to Mock-only exactly like Phase 1 (ADR-011) — unaffected.
 */
const compiler = isGeminiConfigured()
  ? wrapCompilerWithDevFallback(new GeminiPromptCompiler(), mockCompiler)
  : mockCompiler;

const evaluator = isGeminiConfigured()
  ? wrapEvaluatorWithDevFallback(new GeminiPromptEvaluator(), mockEvaluator)
  : mockEvaluator;

export const compilePipelineDeps: CompilePipelineDeps = {
  registry: new InMemoryProviderRegistry(),
  compiler,
  evaluator,
};

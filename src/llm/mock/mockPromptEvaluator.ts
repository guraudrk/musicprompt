import type { LLMProvider } from "@/llm/types";
import type { PromptEvaluator, PromptEvaluationInput, CompilerMetadata } from "@/compiler/types";
import { PromptQualityReportSchema, type PromptQualityReport } from "@/domain/evaluation/schema";
import { MockLLMProvider, MOCK_TASK } from "./mockLLMProvider";

/** Deterministic PromptEvaluator used in CI and this slice's vertical proof (ADR-009, ADR-011). */
export class MockPromptEvaluator implements PromptEvaluator {
  readonly metadata: CompilerMetadata = { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" };

  constructor(private readonly llm: LLMProvider = new MockLLMProvider()) {}

  async evaluate(input: PromptEvaluationInput): Promise<PromptQualityReport> {
    return this.llm.generateStructured({
      task: MOCK_TASK.EVALUATE_PROMPT_PACKAGE,
      systemInstruction: "independent-evaluator",
      payload: input,
      schema: PromptQualityReportSchema,
    });
  }
}

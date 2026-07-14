import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { PromptEvaluator, PromptEvaluationInput } from "@/compiler/types";
import { PromptQualityReportSchema, type PromptQualityReport } from "@/domain/evaluation/schema";
import { GeminiLLMProvider } from "./geminiLLMProvider";

// Placeholder instruction. Phase 3 replaces this with a versioned file
// (prompt-evaluator.system.md) per IMPLEMENTATION_PLAN.md §3.5 — ADR-009 requires the evaluator
// to use a system instruction and schema separate from the compiler's.
const PROMPT_EVALUATOR_SYSTEM_INSTRUCTION =
  "Independently score the compiled prompt package against the source song design. This is a design-fit score, not an artistic absolute.";

export class GeminiPromptEvaluator implements PromptEvaluator {
  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {}

  async evaluate(input: PromptEvaluationInput): Promise<PromptQualityReport> {
    return this.llm.generateStructured({
      task: "evaluate-prompt-package",
      systemInstruction: PROMPT_EVALUATOR_SYSTEM_INSTRUCTION,
      payload: input,
      schema: PromptQualityReportSchema,
    });
  }
}

import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { PromptEvaluator, PromptEvaluationInput, CompilerMetadata } from "@/compiler/types";
import { PromptQualityReportSchema, type PromptQualityReport } from "@/domain/evaluation/schema";
import { getGeminiEnvConfig } from "@/lib/env";
import { GeminiLLMProvider } from "./geminiLLMProvider";
import { readSystemInstructionTemplate } from "./readTemplate";

const PROMPT_EVALUATOR_SYSTEM_INSTRUCTION = readSystemInstructionTemplate("prompt-evaluator.system.md");
const PROMPT_TEMPLATE_VERSION = "1";

export class GeminiPromptEvaluator implements PromptEvaluator {
  readonly metadata: CompilerMetadata;

  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {
    const config = getGeminiEnvConfig();
    this.metadata = { model: config.model, apiMode: config.apiMode, promptTemplateVersion: PROMPT_TEMPLATE_VERSION };
  }

  async evaluate(input: PromptEvaluationInput): Promise<PromptQualityReport> {
    return this.llm.generateStructured({
      task: "evaluate-prompt-package",
      systemInstruction: PROMPT_EVALUATOR_SYSTEM_INSTRUCTION,
      payload: input,
      schema: PromptQualityReportSchema,
    });
  }
}

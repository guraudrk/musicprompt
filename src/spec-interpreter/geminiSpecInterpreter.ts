import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { CompilerMetadata } from "@/compiler/types";
import type { SpecInterpreter, SpecInterpretInput } from "./types";
import { SpecInterpretationSchema, type SpecInterpretation } from "@/domain/songDesignSpec/interpretation";
import { getGeminiEnvConfig } from "@/lib/env";
import { GeminiLLMProvider } from "@/llm/gemini/geminiLLMProvider";
import { readSystemInstructionTemplate } from "@/llm/gemini/readTemplate";

const SPEC_INTERPRET_SYSTEM_INSTRUCTION = readSystemInstructionTemplate("spec-interpret.system.md");
const PROMPT_TEMPLATE_VERSION = "1";

export class GeminiSpecInterpreter implements SpecInterpreter {
  readonly metadata: CompilerMetadata;

  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {
    const config = getGeminiEnvConfig();
    this.metadata = { model: config.model, apiMode: config.apiMode, promptTemplateVersion: PROMPT_TEMPLATE_VERSION };
  }

  async interpret(input: SpecInterpretInput): Promise<SpecInterpretation> {
    return this.llm.generateStructured({
      task: "interpret-spec",
      systemInstruction: SPEC_INTERPRET_SYSTEM_INSTRUCTION,
      payload: input,
      schema: SpecInterpretationSchema,
    });
  }
}

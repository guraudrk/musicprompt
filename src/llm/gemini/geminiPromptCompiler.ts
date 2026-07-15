import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { PromptCompiler, ProviderCompilerInput, PromptRepairInput, CompilerMetadata } from "@/compiler/types";
import { CompilerOutputSchema, type CompilerOutput } from "@/domain/promptPackage/schema";
import { getGeminiEnvConfig } from "@/lib/env";
import { GeminiLLMProvider } from "./geminiLLMProvider";
import { readSystemInstructionTemplate } from "./readTemplate";

const PROVIDER_COMPILER_SYSTEM_INSTRUCTION = readSystemInstructionTemplate("provider-compiler.system.md");
const PROMPT_REPAIR_SYSTEM_INSTRUCTION = readSystemInstructionTemplate("prompt-repair.system.md");
const PROMPT_TEMPLATE_VERSION = "1";

export class GeminiPromptCompiler implements PromptCompiler {
  readonly metadata: CompilerMetadata;

  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {
    const config = getGeminiEnvConfig();
    this.metadata = { model: config.model, apiMode: config.apiMode, promptTemplateVersion: PROMPT_TEMPLATE_VERSION };
  }

  async compile(input: ProviderCompilerInput): Promise<CompilerOutput> {
    return this.llm.generateStructured({
      task: "compile-prompt-package",
      systemInstruction: PROVIDER_COMPILER_SYSTEM_INSTRUCTION,
      payload: input,
      schema: CompilerOutputSchema,
    });
  }

  async repair(input: PromptRepairInput): Promise<CompilerOutput> {
    return this.llm.generateStructured({
      task: "repair-prompt-package",
      systemInstruction: PROMPT_REPAIR_SYSTEM_INSTRUCTION,
      payload: input,
      schema: CompilerOutputSchema,
    });
  }
}

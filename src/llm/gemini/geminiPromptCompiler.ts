import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { PromptCompiler, ProviderCompilerInput, PromptRepairInput } from "@/compiler/types";
import { MusicAIPromptPackageSchema, type MusicAIPromptPackage } from "@/domain/promptPackage/schema";
import { GeminiLLMProvider } from "./geminiLLMProvider";

// Placeholder instructions. Phase 3 replaces these with versioned files
// (provider-compiler.system.md, prompt-repair.system.md) per IMPLEMENTATION_PLAN.md §3.5 —
// ADR-009 requires the compiler and evaluator to use separate system instructions.
const PROVIDER_COMPILER_SYSTEM_INSTRUCTION =
  "Convert the structured song design into a fluent, provider-specific prompt package. Do not override user-confirmed fields, invent capabilities, or rewrite locked lyrics.";
const PROMPT_REPAIR_SYSTEM_INSTRUCTION =
  "Fix only the reported validation errors in the previous output. Do not perform unrelated rewriting.";

export class GeminiPromptCompiler implements PromptCompiler {
  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {}

  async compile(input: ProviderCompilerInput): Promise<MusicAIPromptPackage> {
    return this.llm.generateStructured({
      task: "compile-prompt-package",
      systemInstruction: PROVIDER_COMPILER_SYSTEM_INSTRUCTION,
      payload: input,
      schema: MusicAIPromptPackageSchema,
    });
  }

  async repair(input: PromptRepairInput): Promise<MusicAIPromptPackage> {
    return this.llm.generateStructured({
      task: "repair-prompt-package",
      systemInstruction: PROMPT_REPAIR_SYSTEM_INSTRUCTION,
      payload: input,
      schema: MusicAIPromptPackageSchema,
    });
  }
}

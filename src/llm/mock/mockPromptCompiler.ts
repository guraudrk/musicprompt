import type { LLMProvider } from "@/llm/types";
import type { PromptCompiler, ProviderCompilerInput, PromptRepairInput, CompilerMetadata } from "@/compiler/types";
import { CompilerOutputSchema, type CompilerOutput } from "@/domain/promptPackage/schema";
import { MockLLMProvider, MOCK_TASK } from "./mockLLMProvider";

/** Deterministic PromptCompiler used in CI and this slice's vertical proof (ADR-011). */
export class MockPromptCompiler implements PromptCompiler {
  readonly metadata: CompilerMetadata = { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" };

  constructor(private readonly llm: LLMProvider = new MockLLMProvider()) {}

  async compile(input: ProviderCompilerInput): Promise<CompilerOutput> {
    return this.llm.generateStructured({
      task: MOCK_TASK.COMPILE_PROMPT_PACKAGE,
      systemInstruction: "spec-driven-compiler",
      payload: input,
      schema: CompilerOutputSchema,
    });
  }

  async repair(input: PromptRepairInput): Promise<CompilerOutput> {
    // The mock builder is deterministic and always schema-valid, so "repair" simply recompiles
    // from the original structured input rather than attempting free-form correction.
    return this.compile(input.originalInput);
  }
}

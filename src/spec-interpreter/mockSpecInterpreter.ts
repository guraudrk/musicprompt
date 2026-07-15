import type { LLMProvider } from "@/llm/types";
import type { CompilerMetadata } from "@/compiler/types";
import type { SpecInterpreter, SpecInterpretInput } from "./types";
import { SpecInterpretationSchema, type SpecInterpretation } from "@/domain/songDesignSpec/interpretation";
import { MockLLMProvider, MOCK_TASK } from "@/llm/mock/mockLLMProvider";

/** Deterministic SpecInterpreter used in CI and the Mock-forced verification path (ADR-044). */
export class MockSpecInterpreter implements SpecInterpreter {
  readonly metadata: CompilerMetadata = { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" };

  constructor(private readonly llm: LLMProvider = new MockLLMProvider()) {}

  async interpret(input: SpecInterpretInput): Promise<SpecInterpretation> {
    return this.llm.generateStructured({
      task: MOCK_TASK.INTERPRET_SPEC,
      systemInstruction: "spec-interpreter",
      payload: input,
      schema: SpecInterpretationSchema,
    });
  }
}

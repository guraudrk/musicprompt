import type { LLMProvider } from "@/llm/types";
import type { CompilerMetadata } from "@/compiler/types";
import type { LyricsDraftGenerator, LyricsDraftInput } from "./types";
import { LyricsDraftSetSchema, type LyricsDraftSet } from "@/domain/lyrics/draft";
import { MockLLMProvider, MOCK_TASK } from "@/llm/mock/mockLLMProvider";

/** Deterministic LyricsDraftGenerator used in CI and this slice's vertical proof (ADR-011). */
export class MockLyricsDraftGenerator implements LyricsDraftGenerator {
  readonly metadata: CompilerMetadata = { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" };

  constructor(private readonly llm: LLMProvider = new MockLLMProvider()) {}

  async draft(input: LyricsDraftInput): Promise<LyricsDraftSet> {
    return this.llm.generateStructured({
      task: MOCK_TASK.DRAFT_LYRICS,
      systemInstruction: "lyrics-draft-generator",
      payload: input,
      schema: LyricsDraftSetSchema,
    });
  }
}

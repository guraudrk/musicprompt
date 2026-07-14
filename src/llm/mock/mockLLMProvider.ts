import type { ZodType } from "zod";
import type { LLMProvider } from "@/llm/types";
import { buildCompilePayload, buildEvaluatePayload } from "./mockOutputBuilders";
import { buildLyricsDraftSet } from "./lyricsDraftBuilder";

export const MOCK_TASK = {
  COMPILE_PROMPT_PACKAGE: "compile-prompt-package",
  EVALUATE_PROMPT_PACKAGE: "evaluate-prompt-package",
  DRAFT_LYRICS: "draft-lyrics",
} as const;

/**
 * Deterministic stand-in for a real LLM call (ADR-011: mock-first development). Routes on
 * `task` name to the matching deterministic builder rather than performing any generation, so
 * CI never needs network access or an API key.
 */
export class MockLLMProvider implements LLMProvider {
  async generateStructured<T>(input: {
    task: string;
    systemInstruction: string;
    payload: unknown;
    schema: ZodType<T>;
  }): Promise<T> {
    const raw = this.buildRawOutput(input.task, input.payload);
    return input.schema.parse(raw);
  }

  private buildRawOutput(task: string, payload: unknown): unknown {
    switch (task) {
      case MOCK_TASK.COMPILE_PROMPT_PACKAGE:
        return buildCompilePayload(payload as Parameters<typeof buildCompilePayload>[0]);
      case MOCK_TASK.EVALUATE_PROMPT_PACKAGE:
        return buildEvaluatePayload(payload as Parameters<typeof buildEvaluatePayload>[0]);
      case MOCK_TASK.DRAFT_LYRICS:
        return buildLyricsDraftSet(payload as Parameters<typeof buildLyricsDraftSet>[0]);
      default:
        throw new Error(`MockLLMProvider has no deterministic output registered for task "${task}".`);
    }
  }
}

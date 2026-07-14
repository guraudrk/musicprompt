import "server-only";
import type { ZodType } from "zod";
import type { LLMProvider } from "@/llm/types";
import { getGeminiEnvConfig } from "@/lib/env";

/**
 * Server-only adapter skeleton (ADR-005, ADR-007). Real Google GenAI SDK wiring is Phase 3, once
 * the current official SDK shape and the `GEMINI_API_MODE` value are verified against Google's
 * official docs (see DECISIONS.md ADR-007 and the "Pending decisions" section). This class
 * exists now so PromptCompiler/PromptEvaluator can depend on the LLMProvider interface without
 * caring which backend serves it (ADR-011).
 */
export class GeminiLLMProvider implements LLMProvider {
  async generateStructured<T>(input: {
    task: string;
    systemInstruction: string;
    payload: unknown;
    schema: ZodType<T>;
  }): Promise<T> {
    // Throws a clear, secret-free configuration error if GEMINI_API_KEY/MODEL/API_MODE are unset.
    getGeminiEnvConfig();

    throw new Error(
      `GeminiLLMProvider is a server-only skeleton in this slice (task "${input.task}" was requested). ` +
        "Live Google GenAI SDK wiring is implemented in Phase 3, after the current official SDK shape is verified (DECISIONS.md ADR-007).",
    );
  }
}

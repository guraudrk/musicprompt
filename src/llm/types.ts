import type { ZodType } from "zod";

/**
 * PRODUCT_SPEC.md §9.3. Both MockLLMProvider and GeminiLLMProvider implement this so the
 * compiler pipeline never depends on transport details (ADR-007).
 */
export interface LLMProvider {
  generateStructured<T>(input: {
    task: string;
    systemInstruction: string;
    payload: unknown;
    schema: ZodType<T>;
  }): Promise<T>;
}

import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";
import type { LLMProvider } from "@/llm/types";
import { getGeminiEnvConfig } from "@/lib/env";
import {
  GEMINI_FALLBACK_AFTER_TIMEOUT_OPTIONS,
  GEMINI_REQUEST_OPTIONS,
  isTimeoutError,
  isTransientServerError,
  mapGeminiError,
} from "./resilience";

/**
 * Strips a ```json ... ``` (or bare ``` ... ```) code fence some models wrap structured output in
 * despite being told not to (observed live from the ADR-054 fallback model, 2026-07-17) — returns
 * the input unchanged if it isn't fenced.
 */
function stripMarkdownFence(text: string): string {
  const match = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : text;
}

/**
 * Real Google GenAI SDK adapter (Phase 3, ADR-028/ADR-007). Uses the Interactions API
 * (`client.interactions.create`), the current recommended way to get structured JSON output from
 * `@google/genai` — verified against ai.google.dev and the installed package's own type
 * definitions, not assumed from memory. Zod schemas are converted to JSON Schema via Zod 4's
 * built-in `z.toJSONSchema()`, and the response is parsed back through the *original* Zod schema
 * so runtime validation never trusts the model's output blindly.
 */
export class GeminiLLMProvider implements LLMProvider {
  async generateStructured<T>(input: {
    task: string;
    systemInstruction: string;
    payload: unknown;
    schema: ZodType<T>;
  }): Promise<T> {
    const config = getGeminiEnvConfig();
    const client = new GoogleGenAI({ apiKey: config.apiKey });
    const jsonSchema = z.toJSONSchema(input.schema);

    const callModel = (model: string, options: typeof GEMINI_REQUEST_OPTIONS) =>
      client.interactions.create(
        {
          model,
          input: JSON.stringify(input.payload),
          system_instruction: input.systemInstruction,
          response_format: { type: "text", mime_type: "application/json", schema: jsonSchema },
        },
        options,
      );

    let outputText: string | undefined;
    try {
      const interaction = await callModel(config.model, GEMINI_REQUEST_OPTIONS);
      outputText = interaction.output_text;
    } catch (error) {
      const timedOut = isTimeoutError(error);
      const canFallback = (isTransientServerError(error) || timedOut) && config.fallbackModel !== config.model;
      if (canFallback) {
        console.warn(
          `[GeminiLLMProvider] ${config.model} ${timedOut ? "timed out" : "returned a transient server error"} ` +
            `for task "${input.task}"; retrying once with fallback model ${config.fallbackModel}.`,
        );
        try {
          const interaction = await callModel(
            config.fallbackModel,
            timedOut ? GEMINI_FALLBACK_AFTER_TIMEOUT_OPTIONS : GEMINI_REQUEST_OPTIONS,
          );
          outputText = interaction.output_text;
        } catch (fallbackError) {
          throw mapGeminiError(fallbackError);
        }
      } else {
        throw mapGeminiError(error);
      }
    }

    if (!outputText) {
      throw new Error(`Gemini returned no output_text for task "${input.task}".`);
    }

    return input.schema.parse(JSON.parse(stripMarkdownFence(outputText)));
  }
}

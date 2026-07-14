import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";
import type { LLMProvider } from "@/llm/types";
import { getGeminiEnvConfig } from "@/lib/env";
import { GEMINI_REQUEST_OPTIONS, mapGeminiError } from "./resilience";

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

    let outputText: string | undefined;
    try {
      const interaction = await client.interactions.create(
        {
          model: config.model,
          input: JSON.stringify(input.payload),
          system_instruction: input.systemInstruction,
          response_format: { type: "text", mime_type: "application/json", schema: jsonSchema },
        },
        GEMINI_REQUEST_OPTIONS,
      );
      outputText = interaction.output_text;
    } catch (error) {
      throw mapGeminiError(error);
    }

    if (!outputText) {
      throw new Error(`Gemini returned no output_text for task "${input.task}".`);
    }

    return input.schema.parse(JSON.parse(outputText));
  }
}

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { GeminiLLMProvider } from "@/llm/gemini/geminiLLMProvider";

describe("GeminiLLMProvider (server-only skeleton)", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_API_MODE;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a configuration error, without leaking any key value, when GEMINI_API_KEY is absent", async () => {
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({
        task: "compile-prompt-package",
        systemInstruction: "test",
        payload: {},
        schema: z.object({}),
      }),
    ).rejects.toThrow(/GEMINI_API_KEY is not configured/);
  });

  it("throws a not-yet-implemented error (never a live network call) once env is configured", async () => {
    process.env.GEMINI_API_KEY = "test-key-not-a-real-secret";
    process.env.GEMINI_MODEL = "test-model";
    process.env.GEMINI_API_MODE = "test-mode";

    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({
        task: "compile-prompt-package",
        systemInstruction: "test",
        payload: {},
        schema: z.object({}),
      }),
    ).rejects.toThrow(/server-only skeleton/);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const mockCreate = vi.fn();

vi.mock("@google/genai", async () => {
  const actual = await vi.importActual<typeof import("@google/genai")>("@google/genai");
  return {
    ...actual,
    GoogleGenAI: vi.fn().mockImplementation(function GoogleGenAIMock(this: { interactions: unknown }) {
      this.interactions = { create: mockCreate };
    }),
  };
});

const { GeminiLLMProvider } = await import("@/llm/gemini/geminiLLMProvider");
const { ApiError } = await import("@google/genai");

describe("GeminiLLMProvider", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    mockCreate.mockReset();
    process.env.GEMINI_API_KEY = "test-key-not-a-real-secret";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    process.env.GEMINI_API_MODE = "interactions";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("throws a configuration error, without leaking any key value, when GEMINI_API_KEY is absent", async () => {
    delete process.env.GEMINI_API_KEY;
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/GEMINI_API_KEY is not configured/);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("calls interactions.create with model/system_instruction/input/response_format and parses output_text", async () => {
    mockCreate.mockResolvedValue({ output_text: JSON.stringify({ hello: "world" }) });

    const provider = new GeminiLLMProvider();
    const schema = z.object({ hello: z.string() });

    const result = await provider.generateStructured({
      task: "compile-prompt-package",
      systemInstruction: "system instruction text",
      payload: { a: 1 },
      schema,
    });

    expect(result).toEqual({ hello: "world" });
    expect(mockCreate).toHaveBeenCalledTimes(1);

    const [params, options] = mockCreate.mock.calls[0];
    expect(params.model).toBe("gemini-2.5-flash");
    expect(params.system_instruction).toBe("system instruction text");
    expect(params.input).toBe(JSON.stringify({ a: 1 }));
    expect(params.response_format).toMatchObject({ type: "text", mime_type: "application/json" });
    expect(params.response_format.schema).toBeTypeOf("object");
    expect(options).toEqual({ timeout: 90_000, maxRetries: 0 });
  });

  it("throws when the SDK returns no output_text", async () => {
    mockCreate.mockResolvedValue({ output_text: undefined });
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/no output_text/);
  });

  it("throws if the parsed output fails the given Zod schema", async () => {
    mockCreate.mockResolvedValue({ output_text: JSON.stringify({ wrong: "shape" }) });
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({
        task: "t",
        systemInstruction: "s",
        payload: {},
        schema: z.object({ hello: z.string() }),
      }),
    ).rejects.toThrow();
  });

  it("maps a 429 ApiError to a clear rate-limit message instead of the raw SDK error", async () => {
    mockCreate.mockRejectedValue(new ApiError({ message: "Too Many Requests", status: 429 }));
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/rate limit/i);
  });
});

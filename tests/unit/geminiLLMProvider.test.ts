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

/** Stand-in for the SDK's internal (non-exported) timeout error class, matched in
 * resilience.ts's `isTimeoutError` by constructor name (see ADR-054). */
class FakeTimeoutError extends Error {}
Object.defineProperty(FakeTimeoutError, "name", { value: "APIConnectionTimeoutError" });

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

  it("strips a ```json code fence around output_text before parsing (observed from a real fallback-model response)", async () => {
    mockCreate.mockResolvedValue({ output_text: "```json\n" + JSON.stringify({ hello: "world" }) + "\n```" });
    const provider = new GeminiLLMProvider();

    const result = await provider.generateStructured({
      task: "t",
      systemInstruction: "s",
      payload: {},
      schema: z.object({ hello: z.string() }),
    });

    expect(result).toEqual({ hello: "world" });
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

  it("retries once against the fallback model on a transient (5xx) server error, and succeeds (ADR-054)", async () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    // GEMINI_FALLBACK_MODEL left unset, so it defaults to "gemini-2.5-flash" (distinct from above).
    mockCreate
      .mockRejectedValueOnce(new ApiError({ message: "currently experiencing high demand", status: 500 }))
      .mockResolvedValueOnce({ output_text: JSON.stringify({ hello: "world" }) });
    const provider = new GeminiLLMProvider();

    const result = await provider.generateStructured({
      task: "t",
      systemInstruction: "s",
      payload: {},
      schema: z.object({ hello: z.string() }),
    });

    expect(result).toEqual({ hello: "world" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][0].model).toBe("gemini-3.5-flash");
    expect(mockCreate.mock.calls[1][0].model).toBe("gemini-2.5-flash");
  });

  it("retries once against the fallback model on a primary-model timeout, using the shorter fallback timeout budget (ADR-054)", async () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    mockCreate
      .mockRejectedValueOnce(new FakeTimeoutError("Request timed out"))
      .mockResolvedValueOnce({ output_text: JSON.stringify({ hello: "world" }) });
    const provider = new GeminiLLMProvider();

    const result = await provider.generateStructured({
      task: "t",
      systemInstruction: "s",
      payload: {},
      schema: z.object({ hello: z.string() }),
    });

    expect(result).toEqual({ hello: "world" });
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect(mockCreate.mock.calls[0][1]).toEqual({ timeout: 90_000, maxRetries: 0 });
    expect(mockCreate.mock.calls[1][0].model).toBe("gemini-2.5-flash");
    expect(mockCreate.mock.calls[1][1]).toEqual({ timeout: 30_000, maxRetries: 0 });
  });

  it("does not retry a fallback-model timeout again — surfaces the error after the single fallback attempt", async () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    mockCreate.mockRejectedValue(new FakeTimeoutError("Request timed out"));
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/timed out/i);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("does not retry on a generic error that isn't a recognized timeout or transient-server signature", async () => {
    mockCreate.mockRejectedValue(new Error("Something else went wrong"));
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/something else went wrong/i);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("does not retry when the fallback model is the same as the primary model", async () => {
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    process.env.GEMINI_FALLBACK_MODEL = "gemini-2.5-flash";
    mockCreate.mockRejectedValue(new ApiError({ message: "currently experiencing high demand", status: 500 }));
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/transient server error/i);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("surfaces the fallback model's own error if it also fails", async () => {
    process.env.GEMINI_MODEL = "gemini-3.5-flash";
    mockCreate
      .mockRejectedValueOnce(new ApiError({ message: "high demand", status: 500 }))
      .mockRejectedValueOnce(new ApiError({ message: "Too Many Requests", status: 429 }));
    const provider = new GeminiLLMProvider();

    await expect(
      provider.generateStructured({ task: "t", systemInstruction: "s", payload: {}, schema: z.object({}) }),
    ).rejects.toThrow(/rate limit/i);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LLMProvider } from "@/llm/types";
import { GeminiPromptCompiler } from "@/llm/gemini/geminiPromptCompiler";
import { GeminiPromptEvaluator } from "@/llm/gemini/geminiPromptEvaluator";

function makeFakeLLMProvider() {
  return {
    generateStructured: vi.fn().mockResolvedValue({ fake: "result" }),
  } satisfies LLMProvider;
}

describe("GeminiPromptCompiler / GeminiPromptEvaluator", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key-not-a-real-secret";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    process.env.GEMINI_API_MODE = "interactions";
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("GeminiPromptCompiler throws at construction time when Gemini env is not configured", () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => new GeminiPromptCompiler(makeFakeLLMProvider())).toThrow(/GEMINI_API_KEY is not configured/);
  });

  it("GeminiPromptCompiler.metadata reflects the configured model/apiMode", () => {
    const compiler = new GeminiPromptCompiler(makeFakeLLMProvider());
    expect(compiler.metadata).toEqual({
      model: "gemini-2.5-flash",
      apiMode: "interactions",
      promptTemplateVersion: "1",
    });
  });

  it("GeminiPromptCompiler.compile delegates to the LLMProvider with a non-empty system instruction from the template file", async () => {
    const llm = makeFakeLLMProvider();
    const compiler = new GeminiPromptCompiler(llm);

    await compiler.compile({} as never);

    expect(llm.generateStructured).toHaveBeenCalledTimes(1);
    const [call] = llm.generateStructured.mock.calls[0];
    expect(call.task).toBe("compile-prompt-package");
    expect(call.systemInstruction.length).toBeGreaterThan(50);
    expect(call.systemInstruction).toMatch(/locked/i);
  });

  it("GeminiPromptCompiler.repair uses a different template than compile", async () => {
    const llm = makeFakeLLMProvider();
    const compiler = new GeminiPromptCompiler(llm);

    await compiler.compile({} as never);
    const compileInstruction = llm.generateStructured.mock.calls[0][0].systemInstruction;

    await compiler.repair({ originalInput: {} as never, invalidOutput: {}, validationErrors: [] });
    const repairInstruction = llm.generateStructured.mock.calls[1][0].systemInstruction;

    expect(repairInstruction).not.toBe(compileInstruction);
    expect(llm.generateStructured.mock.calls[1][0].task).toBe("repair-prompt-package");
  });

  it("GeminiPromptEvaluator.evaluate delegates with the evaluator template and correct task", async () => {
    const llm = makeFakeLLMProvider();
    const evaluator = new GeminiPromptEvaluator(llm);

    await evaluator.evaluate({} as never);

    expect(llm.generateStructured).toHaveBeenCalledTimes(1);
    const [call] = llm.generateStructured.mock.calls[0];
    expect(call.task).toBe("evaluate-prompt-package");
    expect(call.systemInstruction).toMatch(/design-fit/i);
  });
});

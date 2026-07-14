import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { wrapCompilerWithDevFallback, wrapEvaluatorWithDevFallback } from "@/llm/devFallback";
import type { PromptCompiler, PromptEvaluator } from "@/compiler/types";

function makeFailingCompiler(): PromptCompiler {
  return {
    metadata: { model: "gemini-x", apiMode: "interactions", promptTemplateVersion: "1" },
    compile: vi.fn().mockRejectedValue(new Error("compile boom")),
    repair: vi.fn().mockRejectedValue(new Error("repair boom")),
  };
}

function makeSucceedingCompiler(): PromptCompiler {
  return {
    metadata: { model: "gemini-x", apiMode: "interactions", promptTemplateVersion: "1" },
    compile: vi.fn().mockResolvedValue("real-compile-result"),
    repair: vi.fn().mockResolvedValue("real-repair-result"),
  } as unknown as PromptCompiler;
}

function makeMockCompiler(): PromptCompiler {
  return {
    metadata: { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" },
    compile: vi.fn().mockResolvedValue("mock-compile-result"),
    repair: vi.fn().mockResolvedValue("mock-repair-result"),
  } as unknown as PromptCompiler;
}

function makeFailingEvaluator(): PromptEvaluator {
  return {
    metadata: { model: "gemini-x", apiMode: "interactions", promptTemplateVersion: "1" },
    evaluate: vi.fn().mockRejectedValue(new Error("evaluate boom")),
  };
}

function makeSucceedingEvaluator(): PromptEvaluator {
  return {
    metadata: { model: "gemini-x", apiMode: "interactions", promptTemplateVersion: "1" },
    evaluate: vi.fn().mockResolvedValue("real-evaluate-result"),
  } as unknown as PromptEvaluator;
}

function makeMockEvaluator(): PromptEvaluator {
  return {
    metadata: { model: "mock", apiMode: "mock", promptTemplateVersion: "n/a" },
    evaluate: vi.fn().mockResolvedValue("mock-evaluate-result"),
  } as unknown as PromptEvaluator;
}

describe("wrapCompilerWithDevFallback", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    warnSpy.mockRestore();
  });

  it("falls back to Mock in development when the real compiler throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const wrapped = wrapCompilerWithDevFallback(makeFailingCompiler(), makeMockCompiler());

    await expect(wrapped.compile({} as never)).resolves.toBe("mock-compile-result");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("falls back to Mock on repair() too", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const wrapped = wrapCompilerWithDevFallback(makeFailingCompiler(), makeMockCompiler());

    await expect(wrapped.repair({} as never)).resolves.toBe("mock-repair-result");
  });

  it("rethrows in production instead of falling back", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const wrapped = wrapCompilerWithDevFallback(makeFailingCompiler(), makeMockCompiler());

    await expect(wrapped.compile({} as never)).rejects.toThrow("compile boom");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("exposes the real compiler's metadata before any call, and after a successful real call", async () => {
    const real = makeSucceedingCompiler();
    const mock = makeMockCompiler();
    const wrapped = wrapCompilerWithDevFallback(real, mock);
    expect(wrapped.metadata).toEqual(real.metadata);

    await wrapped.compile({} as never);
    expect(wrapped.metadata).toEqual(real.metadata);
  });

  it("switches metadata to the mock's after a fallback actually occurs (so persisted metadata never mislabels Mock output as Gemini)", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const real = makeFailingCompiler();
    const mock = makeMockCompiler();
    const wrapped = wrapCompilerWithDevFallback(real, mock);

    await wrapped.compile({} as never);
    expect(wrapped.metadata).toEqual(mock.metadata);
  });
});

describe("wrapEvaluatorWithDevFallback", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    warnSpy.mockRestore();
  });

  it("falls back to Mock in development when the real evaluator throws", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const wrapped = wrapEvaluatorWithDevFallback(makeFailingEvaluator(), makeMockEvaluator());

    await expect(wrapped.evaluate({} as never)).resolves.toBe("mock-evaluate-result");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("rethrows in production instead of falling back", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const wrapped = wrapEvaluatorWithDevFallback(makeFailingEvaluator(), makeMockEvaluator());

    await expect(wrapped.evaluate({} as never)).rejects.toThrow("evaluate boom");
  });

  it("switches metadata to the mock's after a fallback actually occurs", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const real = makeFailingEvaluator();
    const mock = makeMockEvaluator();
    const wrapped = wrapEvaluatorWithDevFallback(real, mock);

    await wrapped.evaluate({} as never);
    expect(wrapped.metadata).toEqual(mock.metadata);
  });

  it("keeps the real evaluator's metadata after a successful real call", async () => {
    const real = makeSucceedingEvaluator();
    const wrapped = wrapEvaluatorWithDevFallback(real, makeMockEvaluator());

    await wrapped.evaluate({} as never);
    expect(wrapped.metadata).toEqual(real.metadata);
  });
});

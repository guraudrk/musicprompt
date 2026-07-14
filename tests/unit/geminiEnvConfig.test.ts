import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isGeminiConfigured } from "@/lib/env";

describe("isGeminiConfigured", () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
    delete process.env.GEMINI_API_MODE;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("is false when nothing is set", () => {
    expect(isGeminiConfigured()).toBe(false);
  });

  it("is false when the key/model are still placeholders", () => {
    process.env.GEMINI_API_KEY = "REPLACE_WITH_A_NEW_KEY";
    process.env.GEMINI_MODEL = "REPLACE_WITH_CURRENT_SUPPORTED_MODEL";
    process.env.GEMINI_API_MODE = "interactions";
    expect(isGeminiConfigured()).toBe(false);
  });

  it("is true when all three are set to real-looking values", () => {
    process.env.GEMINI_API_KEY = "a-real-looking-key";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    process.env.GEMINI_API_MODE = "interactions";
    expect(isGeminiConfigured()).toBe(true);
  });
});

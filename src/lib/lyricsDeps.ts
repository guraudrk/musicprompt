import "server-only";
import { MockLyricsDraftGenerator } from "@/lyrics/mockLyricsDraftGenerator";
import { GeminiLyricsDraftGenerator } from "@/lyrics/geminiLyricsDraftGenerator";
import { wrapLyricsDraftGeneratorWithDevFallback } from "@/llm/devFallback";
import { isGeminiConfigured } from "@/lib/env";
import type { LyricsDraftGenerator } from "@/lyrics/types";

const mockLyricsDraftGenerator = new MockLyricsDraftGenerator();

/** Same Gemini-when-configured / dev-only-fallback pattern as src/lib/compilerDeps.ts (ADR-029). */
export const lyricsDraftGenerator: LyricsDraftGenerator = isGeminiConfigured()
  ? wrapLyricsDraftGeneratorWithDevFallback(new GeminiLyricsDraftGenerator(), mockLyricsDraftGenerator)
  : mockLyricsDraftGenerator;

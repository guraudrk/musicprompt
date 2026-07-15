import "server-only";
import { MockSpecInterpreter } from "@/spec-interpreter/mockSpecInterpreter";
import { GeminiSpecInterpreter } from "@/spec-interpreter/geminiSpecInterpreter";
import { wrapSpecInterpreterWithDevFallback } from "@/llm/devFallback";
import { isGeminiConfigured } from "@/lib/env";
import type { SpecInterpreter } from "@/spec-interpreter/types";

const mockSpecInterpreter = new MockSpecInterpreter();

/** Same Gemini-when-configured / dev-only-fallback pattern as src/lib/lyricsDeps.ts (ADR-029/ADR-044). */
export const specInterpreter: SpecInterpreter = isGeminiConfigured()
  ? wrapSpecInterpreterWithDevFallback(new GeminiSpecInterpreter(), mockSpecInterpreter)
  : mockSpecInterpreter;

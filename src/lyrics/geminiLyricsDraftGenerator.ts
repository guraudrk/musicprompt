import "server-only";
import type { LLMProvider } from "@/llm/types";
import type { CompilerMetadata } from "@/compiler/types";
import type { LyricsDraftGenerator, LyricsDraftInput } from "./types";
import { LyricsDraftSetSchema, type LyricsDraftSet } from "@/domain/lyrics/draft";
import { getGeminiEnvConfig } from "@/lib/env";
import { GeminiLLMProvider } from "@/llm/gemini/geminiLLMProvider";
import { readSystemInstructionTemplate } from "@/llm/gemini/readTemplate";

const LYRICS_DRAFT_SYSTEM_INSTRUCTION = readSystemInstructionTemplate("lyrics-draft.system.md");
const PROMPT_TEMPLATE_VERSION = "1";

export class GeminiLyricsDraftGenerator implements LyricsDraftGenerator {
  readonly metadata: CompilerMetadata;

  constructor(private readonly llm: LLMProvider = new GeminiLLMProvider()) {
    const config = getGeminiEnvConfig();
    this.metadata = { model: config.model, apiMode: config.apiMode, promptTemplateVersion: PROMPT_TEMPLATE_VERSION };
  }

  async draft(input: LyricsDraftInput): Promise<LyricsDraftSet> {
    return this.llm.generateStructured({
      task: "draft-lyrics",
      systemInstruction: LYRICS_DRAFT_SYSTEM_INSTRUCTION,
      payload: input,
      schema: LyricsDraftSetSchema,
    });
  }
}

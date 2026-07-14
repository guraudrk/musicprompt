import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { LyricsDraftSet } from "@/domain/lyrics/draft";
import type { CompilerMetadata } from "@/compiler/types";

export type LyricsDraftInput = { spec: SongDesignSpec };

/** Mirrors PromptCompiler's shape (src/compiler/types.ts) — same Mock/Gemini swap pattern. */
export interface LyricsDraftGenerator {
  metadata?: CompilerMetadata;
  draft(input: LyricsDraftInput): Promise<LyricsDraftSet>;
}

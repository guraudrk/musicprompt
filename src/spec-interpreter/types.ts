import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { SpecInterpretation } from "@/domain/songDesignSpec/interpretation";
import type { CompilerMetadata } from "@/compiler/types";

export type SpecInterpretInput = { spec: SongDesignSpec };

/** Mirrors LyricsDraftGenerator's shape (src/lyrics/types.ts) — same Mock/Gemini swap pattern. */
export interface SpecInterpreter {
  metadata?: CompilerMetadata;
  interpret(input: SpecInterpretInput): Promise<SpecInterpretation>;
}

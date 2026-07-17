import "server-only";

export type GeminiEnvConfig = {
  apiKey: string;
  model: string;
  apiMode: string;
  /** ADR-054: documented GA-stable alternative model to retry against, once, when the primary
   * model returns a transient server-side error (e.g. "currently experiencing high demand").
   * Optional — defaults to `gemini-2.5-flash` when `GEMINI_FALLBACK_MODEL` is unset. */
  fallbackModel: string;
};

const PLACEHOLDER_PREFIX = "REPLACE_WITH";

/**
 * Reads and validates the Gemini environment variables. Server-only (the `server-only` import
 * above makes bundling this into a client component a build-time error). Never logs, returns, or
 * embeds the key anywhere other than the returned config object used internally by the adapter.
 */
export function getGeminiEnvConfig(): GeminiEnvConfig {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const apiMode = process.env.GEMINI_API_MODE;

  if (!apiKey || apiKey.startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Set it in .env.local (server-side secret storage only) — never in NEXT_PUBLIC_* variables or client code.",
    );
  }
  if (!model || model.startsWith(PLACEHOLDER_PREFIX)) {
    throw new Error("GEMINI_MODEL is not configured. Set it in .env.local.");
  }
  if (!apiMode) {
    throw new Error("GEMINI_API_MODE is not configured. Set it in .env.local.");
  }

  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

  return { apiKey, model, apiMode, fallbackModel };
}

/** Non-throwing check used to choose Gemini vs. Mock at startup (src/lib/compilerDeps.ts). */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  const apiMode = process.env.GEMINI_API_MODE;
  return Boolean(
    apiKey && !apiKey.startsWith(PLACEHOLDER_PREFIX) && model && !model.startsWith(PLACEHOLDER_PREFIX) && apiMode,
  );
}

import { ApiError } from "@google/genai";

/**
 * Passed as the second argument to every `client.interactions.create(...)` call. The SDK itself
 * implements timeout/retry (confirmed by reading its own type definitions —
 * `GoogleGenAIRequestOptions` has `timeout`/`maxRetries`); we don't reimplement that. `maxRetries:
 * 1` caps retries so a flaky call never turns into a retry storm (IMPLEMENTATION_PLAN.md §3.7).
 *
 * `timeout: 60_000` — live-verified (docs/PHASE_LOG.md Phase 3 entry): a plain call took ~17s and
 * a small structured-output call took ~19s, and our `MusicAIPromptPackageSchema` is large/nested,
 * so 30s was too tight for three concurrent Safe/Balanced/Bold calls sharing rate limit headroom.
 */
export const GEMINI_REQUEST_OPTIONS = { timeout: 60_000, maxRetries: 1 };

/**
 * Maps the SDK's `ApiError` (has a `.status` HTTP code) to a clearer, user-facing message for the
 * well-known cases. Rate limiting (429) is deliberately not something we auto-retry into — it gets
 * its own distinct error instead (IMPLEMENTATION_PLAN.md §3.7 "Rate-limit response").
 */
export function mapGeminiError(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return new Error("Gemini rate limit reached. Please wait a moment and try again.");
    }
    if (error.status === 401 || error.status === 403) {
      return new Error("Gemini rejected the request's credentials. Check GEMINI_API_KEY.");
    }
    if (error.status >= 500) {
      return new Error(`Gemini had a transient server error (${error.status}). Please try again.`);
    }
    return new Error(`Gemini rejected the request (${error.status}): ${error.message}`);
  }
  return error instanceof Error ? error : new Error("Unknown error calling Gemini.");
}

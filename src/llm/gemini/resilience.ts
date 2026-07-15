import { ApiError } from "@google/genai";

/**
 * Passed as the second argument to every `client.interactions.create(...)` call. The SDK itself
 * implements timeout/retry (confirmed by reading its own type definitions —
 * `GoogleGenAIRequestOptions` has `timeout`/`maxRetries`); we don't reimplement that.
 *
 * `timeout: 90_000` — raised from 60s after ADR-045 (theoryAddressal): live-verified that requiring
 * Gemini to produce a traceable, per-warning `theoryAddressal` entry for every active theory-engine
 * warning measurably increases real response time enough to trip the previous 60s budget.
 *
 * `maxRetries: 0` — lowered from 1 after ADR-049: with the compile prompt now also grounded in the
 * composition-theory document (ADR-048), a timed-out call retrying the *same* request at the SDK
 * level was observed compounding into 3-6 minute waits before falling back to Mock, since a retry
 * of an identical slow request rarely succeeds meaningfully faster. Failing once at 90s (then
 * falling back to Mock in dev, or surfacing a clear error in production) is a better user
 * experience than doubling the wait for an unlikely-to-help retry.
 */
export const GEMINI_REQUEST_OPTIONS = { timeout: 90_000, maxRetries: 0 };

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

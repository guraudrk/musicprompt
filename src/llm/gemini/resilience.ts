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

/** ADR-054: budget for the *fallback-model* retry after a primary-model timeout — deliberately
 * shorter than `GEMINI_REQUEST_OPTIONS`, so a worst case (primary times out, fallback also times
 * out) is capped at 90s + 30s = 120s rather than compounding to 180s, unlike the identical-request
 * retry ADR-049 removed for exactly that reason. */
export const GEMINI_FALLBACK_AFTER_TIMEOUT_OPTIONS = { timeout: 30_000, maxRetries: 0 };

/**
 * ADR-054: identifies a transient server-side error (HTTP 5xx, e.g. "gemini-3.5-flash is currently
 * experiencing high demand") — one of the two failure modes this project retries against a
 * fallback model for.
 */
export function isTransientServerError(error: unknown): boolean {
  return error instanceof ApiError && typeof error.status === "number" && error.status >= 500;
}

/**
 * ADR-054: identifies a client-side timeout — the other failure mode retried against a fallback
 * model, using the shorter `GEMINI_FALLBACK_AFTER_TIMEOUT_OPTIONS` budget. Not the same situation
 * ADR-049 already ruled out: that was retrying the *identical request against the same model*,
 * which rarely helps because the model is just as slow the second time. Retrying against a
 * *different* model is a genuinely different attempt, not a repeat of a slow one.
 *
 * Duck-typed by constructor name rather than `instanceof`, because the SDK's timeout error
 * (`APIConnectionTimeoutError`) is an internal class, not exported from `@google/genai`'s public
 * API surface (only `ApiError` is) — confirmed empirically via live testing (2026-07-17) that a
 * client-side timeout's `error.constructor.name` is always this string.
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.constructor?.name === "APIConnectionTimeoutError";
}

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

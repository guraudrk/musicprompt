/**
 * Generic in-memory, fixed-window, per-key rate limiter. Pure and dependency-free so it's fully
 * unit-testable in isolation (inject `now` for deterministic tests, no real timers/sleeps).
 *
 * Disclosed limitation (see DECISIONS.md ADR-046): only correct within a single running process.
 * On a serverless platform where concurrent/cold-start invocations may run in separate instances
 * with independent memory, the configured limit is not a hard guarantee across all of them — it
 * still meaningfully raises the bar over no limiting at all. A shared store (e.g. Vercel KV/Upstash
 * Redis) would be needed for a precise cross-instance guarantee.
 */
export function createRateLimiter(opts: { windowMs: number; maxRequests: number; now?: () => number }) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const now = opts.now ?? Date.now;

  return {
    check(key: string): { allowed: boolean; retryAfterMs?: number } {
      const t = now();
      const bucket = buckets.get(key);

      if (!bucket || bucket.resetAt <= t) {
        buckets.set(key, { count: 1, resetAt: t + opts.windowMs });
        return { allowed: true };
      }

      if (bucket.count >= opts.maxRequests) {
        return { allowed: false, retryAfterMs: bucket.resetAt - t };
      }

      bucket.count += 1;
      return { allowed: true };
    },
  };
}

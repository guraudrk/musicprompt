import { createRateLimiter } from "./rateLimit";

/**
 * Rate limit for the anonymous no-login demo (ADR-046). Unlimited outside production so local/dev
 * testing is never blocked (explicit product decision); 5 requests per IP per hour once actually
 * deployed. Signed-in users never hit this — they use the authenticated
 * `/api/projects/{id}/compile/...` endpoints, which this limiter does not touch at all.
 */
const DEMO_RATE_LIMIT_MAX = process.env.NODE_ENV === "production" ? 5 : Infinity;
const DEMO_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const limiter = createRateLimiter({ windowMs: DEMO_RATE_LIMIT_WINDOW_MS, maxRequests: DEMO_RATE_LIMIT_MAX });

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function checkDemoRateLimit(request: Request): { allowed: boolean; retryAfterMs?: number } {
  return limiter.check(getClientIp(request));
}

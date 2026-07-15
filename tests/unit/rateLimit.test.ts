import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rateLimit";

describe("createRateLimiter", () => {
  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 3, now: () => 0 });

    expect(limiter.check("a")).toEqual({ allowed: true });
    expect(limiter.check("a")).toEqual({ allowed: true });
    expect(limiter.check("a")).toEqual({ allowed: true });
  });

  it("blocks a request once the limit is reached within the window", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 2, now: () => 0 });

    limiter.check("a");
    limiter.check("a");
    const result = limiter.check("a");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks each key independently", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, now: () => 0 });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("resets once the window has elapsed", () => {
    let currentTime = 0;
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, now: () => currentTime });

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);

    currentTime = 1001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("treats maxRequests: Infinity as effectively unlimited", () => {
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: Infinity, now: () => 0 });

    for (let i = 0; i < 100; i++) {
      expect(limiter.check("a").allowed).toBe(true);
    }
  });
});

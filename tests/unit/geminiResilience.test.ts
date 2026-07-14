import { describe, expect, it } from "vitest";
import { ApiError } from "@google/genai";
import { mapGeminiError } from "@/llm/gemini/resilience";

describe("mapGeminiError", () => {
  it("maps 429 to a clear rate-limit message", () => {
    const err = mapGeminiError(new ApiError({ message: "too many", status: 429 }));
    expect(err.message).toMatch(/rate limit/i);
  });

  it("maps 401 and 403 to a credentials message", () => {
    expect(mapGeminiError(new ApiError({ message: "nope", status: 401 })).message).toMatch(/credentials/i);
    expect(mapGeminiError(new ApiError({ message: "nope", status: 403 })).message).toMatch(/credentials/i);
  });

  it("maps 5xx to a transient server error message", () => {
    expect(mapGeminiError(new ApiError({ message: "boom", status: 503 })).message).toMatch(/transient server error/i);
  });

  it("passes through other statuses with the original status and message", () => {
    const err = mapGeminiError(new ApiError({ message: "bad request", status: 400 }));
    expect(err.message).toContain("400");
    expect(err.message).toContain("bad request");
  });

  it("returns a plain Error unchanged", () => {
    const original = new Error("network down");
    expect(mapGeminiError(original)).toBe(original);
  });

  it("wraps a non-Error thrown value in an Error", () => {
    const err = mapGeminiError("weird throw");
    expect(err).toBeInstanceOf(Error);
  });
});

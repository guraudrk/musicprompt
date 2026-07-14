import { describe, expect, it } from "vitest";
import { diffLines } from "@/lib/diffLines";

describe("diffLines", () => {
  it("marks identical text as entirely unchanged", () => {
    const result = diffLines("a\nb\nc", "a\nb\nc");
    expect(result).toEqual([
      { type: "unchanged", text: "a" },
      { type: "unchanged", text: "b" },
      { type: "unchanged", text: "c" },
    ]);
  });

  it("detects an added line", () => {
    const result = diffLines("a\nb", "a\nb\nc");
    expect(result).toEqual([
      { type: "unchanged", text: "a" },
      { type: "unchanged", text: "b" },
      { type: "added", text: "c" },
    ]);
  });

  it("detects a removed line", () => {
    const result = diffLines("a\nb\nc", "a\nc");
    expect(result).toEqual([
      { type: "unchanged", text: "a" },
      { type: "removed", text: "b" },
      { type: "unchanged", text: "c" },
    ]);
  });

  it("detects a replaced line as a remove + add", () => {
    const result = diffLines("a\nb\nc", "a\nx\nc");
    expect(result).toEqual([
      { type: "unchanged", text: "a" },
      { type: "removed", text: "b" },
      { type: "added", text: "x" },
      { type: "unchanged", text: "c" },
    ]);
  });

  it("handles empty before text", () => {
    const result = diffLines("", "a");
    expect(result.some((l) => l.type === "added" && l.text === "a")).toBe(true);
  });
});

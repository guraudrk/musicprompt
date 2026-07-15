import { describe, expect, it } from "vitest";
import { selectGenreTopline } from "@/llm/gemini/theoryExcerpts";

describe("selectGenreTopline (ADR-052)", () => {
  it("returns only the matching genre's excerpt when one genre is declared", () => {
    const result = selectGenreTopline(["Ballad"]);
    expect(result).toContain("Ballad=earned high notes");
    expect(result).not.toContain("Pop=hook-first");
    expect(result).not.toContain("Rock=riff");
  });

  it("matches case-insensitively and combines multiple declared genres without duplicates", () => {
    const result = selectGenreTopline(["k-pop", "POP"]);
    expect(result).toContain("K-pop=multiple distinct hooks");
    expect(result).toContain("Pop=hook-first");
    expect(result.match(/K-pop=/g)?.length).toBe(1);
  });

  it("falls back to the full genre list when no declared genre is recognized", () => {
    const result = selectGenreTopline(["Vaporwave"]);
    expect(result).toContain("Pop=hook-first");
    expect(result).toContain("Ballad=earned high notes");
    expect(result).toContain("R&B=vocal rhythm");
    expect(result).toContain("Rock=riff");
    expect(result).toContain("K-pop=multiple distinct hooks");
    expect(result).toContain("OST/cinematic=emotional image");
  });

  it("falls back to the full genre list when no genres are declared at all", () => {
    const result = selectGenreTopline([]);
    expect(result).toContain("Pop=hook-first");
    expect(result).toContain("OST/cinematic=emotional image");
  });
});

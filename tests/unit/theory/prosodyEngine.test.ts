import { describe, expect, it } from "vitest";
import { prosodyEngine } from "@/theory/prosodyEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("prosodyEngine", () => {
  it("reminds to verify locked lines' stress once a melody exists", () => {
    const spec = buildValidSpec();
    const { warnings } = prosodyEngine(spec);
    expect(warnings.some((w) => /locked line\(s\)/.test(w.message))).toBe(true);
  });

  it("warns when there is no lyric draft yet", () => {
    const spec = buildValidSpec();
    const { warnings } = prosodyEngine(spec);
    expect(warnings.some((w) => /No lyric draft yet/.test(w.message))).toBe(true);
  });

  it("does not warn about a missing draft once originalLyrics is set", () => {
    const spec = buildValidSpec({
      lyricsDesign: { ...buildValidSpec().lyricsDesign, originalLyrics: "I never found the one who broke me." },
    });
    const { warnings } = prosodyEngine(spec);
    expect(warnings.some((w) => /No lyric draft yet/.test(w.message))).toBe(false);
  });

  it("flags Korean/Japanese for stress/mora review", () => {
    const spec = buildValidSpec({ identity: { ...buildValidSpec().identity, language: "Korean" } });
    const { warnings } = prosodyEngine(spec);
    expect(warnings.some((w) => /particle\/ending stress/.test(w.message))).toBe(true);
  });

  it("does not flag English for stress/mora review", () => {
    const spec = buildValidSpec();
    const { warnings } = prosodyEngine(spec);
    expect(warnings.some((w) => /particle\/ending stress/.test(w.message))).toBe(false);
  });

  it("notes that direct/simple mode prioritizes pronunciation over metaphor", () => {
    const spec = buildValidSpec();
    const { notes } = prosodyEngine(spec);
    expect(notes.prosodyNotes).toMatch(/Direct\/simple mode/);
  });
});

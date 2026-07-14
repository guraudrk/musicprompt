import { describe, expect, it } from "vitest";
import { validateLyricsDraftSet } from "@/lyrics/validateDraftSet";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

function makeDraftSet(overrides: Partial<{ lyrics: string; techniquesUsed: string[] }> = {}) {
  const draft = {
    id: "draft-a",
    label: "A" as const,
    lyrics: overrides.lyrics ?? "I never found the one who broke me.",
    techniquesUsed: overrides.techniquesUsed ?? [],
    notes: "test",
  };
  return { drafts: [draft, { ...draft, id: "draft-b", label: "B" as const }, { ...draft, id: "draft-c", label: "C" as const }] };
}

describe("validateLyricsDraftSet", () => {
  it("passes when locked lines are present and no excluded technique is used", () => {
    const spec = buildValidSpec();
    const result = validateLyricsDraftSet(spec, makeDraftSet());
    expect(result.ok).toBe(true);
  });

  it("catches a missing locked line", () => {
    const spec = buildValidSpec({
      lyricsDesign: { ...buildValidSpec().lyricsDesign, lockedLines: ["This line is not in the draft."] },
    });
    const result = validateLyricsDraftSet(spec, makeDraftSet());
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /locked line was not preserved/.test(e))).toBe(true);
  });

  it("catches an excluded technique being used", () => {
    const spec = buildValidSpec({
      lyricsDesign: { ...buildValidSpec().lyricsDesign, excludedTechniques: ["공감각적 비유"] },
    });
    const result = validateLyricsDraftSet(spec, makeDraftSet({ techniquesUsed: ["공감각적 비유"] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /used excluded technique/.test(e))).toBe(true);
  });

  it("catches a technique used in direct mode", () => {
    const spec = buildValidSpec({ lyricsDesign: { ...buildValidSpec().lyricsDesign, mode: "direct" } });
    const result = validateLyricsDraftSet(spec, makeDraftSet({ techniquesUsed: ["메타포 심기"] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /direct\/simple mode must not use any technique/.test(e))).toBe(true);
  });

  it("catches a reported technique the user never selected (live-testing-caught bug)", () => {
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "metaphorical",
        selectedTechniques: ["공감각적 비유"],
      },
    });
    const result = validateLyricsDraftSet(spec, makeDraftSet({ techniquesUsed: ["직관적 대조"] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /was never selected by the user/.test(e))).toBe(true);
  });

  it("passes when the reported technique was actually selected", () => {
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "metaphorical",
        selectedTechniques: ["공감각적 비유"],
      },
    });
    const result = validateLyricsDraftSet(spec, makeDraftSet({ techniquesUsed: ["공감각적 비유"] }));
    expect(result.ok).toBe(true);
  });
});

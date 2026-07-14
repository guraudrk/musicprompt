import { describe, expect, it } from "vitest";
import { MockLyricsDraftGenerator } from "@/lyrics/mockLyricsDraftGenerator";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("MockLyricsDraftGenerator", () => {
  it("produces exactly 3 drafts labeled A, B, C", async () => {
    const generator = new MockLyricsDraftGenerator();
    const { drafts } = await generator.draft({ spec: buildValidSpec() });
    expect(drafts.map((d) => d.label)).toEqual(["A", "B", "C"]);
  });

  it("never applies a technique in direct mode (default fixture)", async () => {
    const generator = new MockLyricsDraftGenerator();
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "direct",
        selectedTechniques: ["메타포 심기", "공감각적 비유"],
      },
    });
    const { drafts } = await generator.draft({ spec });
    for (const draft of drafts) {
      expect(draft.techniquesUsed).toEqual([]);
    }
  });

  it("never applies a technique in simple_direct mode either", async () => {
    const generator = new MockLyricsDraftGenerator();
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "simple_direct",
        selectedTechniques: ["운율,라임"],
      },
    });
    const { drafts } = await generator.draft({ spec });
    for (const draft of drafts) {
      expect(draft.techniquesUsed).toEqual([]);
    }
  });

  it("includes every locked line verbatim in all 3 drafts", async () => {
    const generator = new MockLyricsDraftGenerator();
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        lockedLines: ["I never found the one who broke me.", "Second locked line."],
      },
    });
    const { drafts } = await generator.draft({ spec });
    for (const draft of drafts) {
      expect(draft.lyrics).toContain("I never found the one who broke me.");
      expect(draft.lyrics).toContain("Second locked line.");
    }
  });

  it("never uses an excluded technique", async () => {
    const generator = new MockLyricsDraftGenerator();
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "metaphorical",
        knowHowIntensity: "deep",
        selectedTechniques: ["메타포 심기", "공감각적 비유"],
        excludedTechniques: ["공감각적 비유"],
      },
    });
    const { drafts } = await generator.draft({ spec });
    for (const draft of drafts) {
      expect(draft.techniquesUsed).not.toContain("공감각적 비유");
    }
  });

  it("uses more techniques in draft C than draft A when the mode allows them", async () => {
    const generator = new MockLyricsDraftGenerator();
    const spec = buildValidSpec({
      lyricsDesign: {
        ...buildValidSpec().lyricsDesign,
        mode: "metaphorical",
        knowHowIntensity: "deep",
        selectedTechniques: ["메타포 심기", "공감각적 비유", "운율,라임"],
        excludedTechniques: [],
      },
    });
    const { drafts } = await generator.draft({ spec });
    const [a, , c] = drafts;
    expect(a.techniquesUsed.length).toBe(0);
    expect(c.techniquesUsed.length).toBeGreaterThan(a.techniquesUsed.length);
  });
});

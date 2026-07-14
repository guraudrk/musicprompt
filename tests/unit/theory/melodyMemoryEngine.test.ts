import { describe, expect, it } from "vitest";
import { melodyMemoryEngine } from "@/theory/melodyMemoryEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("melodyMemoryEngine", () => {
  it("warns when there is only one hook candidate", () => {
    const spec = buildValidSpec();
    const { warnings } = melodyMemoryEngine(spec);
    expect(warnings.some((w) => /Only one hook candidate/.test(w.message))).toBe(true);
  });

  it("does not warn about candidate count when there are several", () => {
    const spec = buildValidSpec({
      hookPlan: {
        candidates: [
          { id: "hook-1", type: "lyrical", description: "a" },
          { id: "hook-2", type: "melodic", description: "b" },
        ],
        selectedId: "hook-1",
        placementSection: "Chorus",
      },
    });
    const { warnings } = melodyMemoryEngine(spec);
    expect(warnings.some((w) => /Only one hook candidate/.test(w.message))).toBe(false);
  });

  it("warns when no hook candidate is selected", () => {
    const spec = buildValidSpec({
      hookPlan: {
        candidates: [{ id: "hook-1", type: "lyrical", description: "a" }],
        placementSection: "Chorus",
      },
    });
    const { warnings } = melodyMemoryEngine(spec);
    expect(warnings.some((w) => /No hook candidate has been selected/.test(w.message))).toBe(true);
  });

  it("warns when no generative core candidate is selected", () => {
    const spec = buildValidSpec({
      generativeCore: {
        candidates: [{ id: "core-1", type: "lyric_line", description: "a" }],
        selectedCandidateIds: [],
      },
    });
    const { warnings } = melodyMemoryEngine(spec);
    expect(warnings.some((w) => /No generative core candidate has been selected/.test(w.message))).toBe(true);
  });

  it("warns when the emotional peak has no hook placement section", () => {
    const spec = buildValidSpec({
      hookPlan: {
        candidates: [{ id: "hook-1", type: "lyrical", description: "a", memorabilityNotes: "n" }],
        selectedId: "hook-1",
      },
    });
    const { warnings } = melodyMemoryEngine(spec);
    expect(warnings.some((w) => /emotional peak isn't tied to a specific section/.test(w.message))).toBe(true);
  });

  it("produces motifNotes and hookNotes", () => {
    const spec = buildValidSpec();
    const { notes } = melodyMemoryEngine(spec);
    expect(notes.motifNotes).toContain("broke me");
    expect(notes.hookNotes).toContain("lyrical");
  });
});

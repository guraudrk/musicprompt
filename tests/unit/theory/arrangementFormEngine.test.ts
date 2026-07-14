import { describe, expect, it } from "vitest";
import { arrangementFormEngine } from "@/theory/arrangementFormEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("arrangementFormEngine", () => {
  it("warns when many sections exist but few production traits are declared", () => {
    const spec = buildValidSpec({
      structure: [
        { id: "s1", name: "Intro", dramaticFunction: "setup", order: 0, energyLevel: 10 },
        { id: "s2", name: "Verse 1", dramaticFunction: "initiation", order: 1, energyLevel: 20 },
        { id: "s3", name: "Chorus", dramaticFunction: "arrival", order: 2, energyLevel: 70 },
        { id: "s4", name: "Bridge", dramaticFunction: "contrast", order: 3, energyLevel: 50 },
      ],
    });
    const { warnings } = arrangementFormEngine(spec);
    expect(warnings.some((w) => /few production traits/.test(w.message))).toBe(true);
  });

  it("does not warn about production traits with a short structure", () => {
    const spec = buildValidSpec();
    const { warnings } = arrangementFormEngine(spec);
    expect(warnings.some((w) => /few production traits/.test(w.message))).toBe(false);
  });

  it("warns when the final chorus isn't arranged bigger than the first", () => {
    const spec = buildValidSpec({
      structure: [
        { id: "s1", name: "Verse 1", dramaticFunction: "initiation", order: 0, energyLevel: 20 },
        { id: "s2", name: "Chorus", dramaticFunction: "arrival", order: 1, energyLevel: 70 },
        { id: "s3", name: "Final Chorus", dramaticFunction: "arrival", order: 2, energyLevel: 70 },
      ],
    });
    const { warnings } = arrangementFormEngine(spec);
    expect(warnings.some((w) => /isn't arranged to feel bigger/.test(w.message))).toBe(true);
  });

  it("does not warn when the final chorus expands on the first (default fixture)", () => {
    const spec = buildValidSpec();
    const { warnings } = arrangementFormEngine(spec);
    expect(warnings.some((w) => /isn't arranged to feel bigger/.test(w.message))).toBe(false);
  });
});

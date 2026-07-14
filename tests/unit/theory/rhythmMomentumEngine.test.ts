import { describe, expect, it } from "vitest";
import { rhythmMomentumEngine } from "@/theory/rhythmMomentumEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("rhythmMomentumEngine", () => {
  it("warns when no rhythmic traits are declared", () => {
    const spec = buildValidSpec();
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /No rhythmic traits declared/.test(w.message))).toBe(true);
  });

  it("warns when silence is never mentioned", () => {
    const spec = buildValidSpec();
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /Silence isn't mentioned/.test(w.message))).toBe(true);
  });

  it("does not warn about silence once it is mentioned in a rhythmic trait", () => {
    const spec = buildValidSpec({
      musicalIdentity: { ...buildValidSpec().musicalIdentity, rhythmicTraits: ["a full bar of silence before the chorus"] },
    });
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /Silence isn't mentioned/.test(w.message))).toBe(false);
  });

  it("does not warn about silence when a contrastPlan description mentions it", () => {
    const spec = buildValidSpec({
      contrastPlan: [{ dimension: "space", between: ["dense", "silent"], description: "A beat of silence right before the drop." }],
    });
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /Silence isn't mentioned/.test(w.message))).toBe(false);
  });

  it("warns when there is no tempo/BPM information at all", () => {
    const spec = buildValidSpec({ musicalIdentity: { ...buildValidSpec().musicalIdentity, tempoDescription: "" } });
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /No tempo or BPM range declared/.test(w.message))).toBe(true);
  });

  it("does not warn about tempo when bpmMin is set even without a description", () => {
    const spec = buildValidSpec({ musicalIdentity: { ...buildValidSpec().musicalIdentity, tempoDescription: "", bpmMin: 80 } });
    const { warnings } = rhythmMomentumEngine(spec);
    expect(warnings.some((w) => /No tempo or BPM range declared/.test(w.message))).toBe(false);
  });
});

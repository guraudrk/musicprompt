import { describe, expect, it } from "vitest";
import { formFunctionEngine } from "@/theory/formFunctionEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("formFunctionEngine", () => {
  it("warns when a section has no dramatic function", () => {
    const spec = buildValidSpec({
      structure: [{ id: "sec-1", name: "Bridge", dramaticFunction: "", order: 0, energyLevel: 50 }],
    });
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /no dramatic function/.test(w.message))).toBe(true);
  });

  it("does not warn about dramatic function when every section has one", () => {
    const spec = buildValidSpec();
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /no dramatic function/.test(w.message))).toBe(false);
  });

  it("warns when verse and chorus energy are too close", () => {
    const spec = buildValidSpec({
      structure: [
        { id: "sec-1", name: "Verse 1", dramaticFunction: "initiation", order: 0, energyLevel: 50 },
        { id: "sec-2", name: "Chorus", dramaticFunction: "arrival", order: 1, energyLevel: 55 },
      ],
    });
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /too close to read as contrasting/.test(w.message))).toBe(true);
  });

  it("warns when pre-chorus energy doesn't sit between verse and chorus", () => {
    const spec = buildValidSpec({
      structure: [
        { id: "sec-1", name: "Verse 1", dramaticFunction: "initiation", order: 0, energyLevel: 20 },
        { id: "sec-2", name: "Pre-Chorus", dramaticFunction: "buildup", order: 1, energyLevel: 10 },
        { id: "sec-3", name: "Chorus", dramaticFunction: "arrival", order: 2, energyLevel: 70 },
      ],
    });
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /Pre-chorus energy/.test(w.message))).toBe(true);
  });

  it("does not warn about the final chorus when meaning shifts are planned", () => {
    const spec = buildValidSpec();
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /final chorus doesn't clearly differ/.test(w.message))).toBe(false);
  });

  it("warns when the final chorus neither expands energy nor shifts meaning", () => {
    const spec = buildValidSpec({
      structure: [
        { id: "sec-1", name: "Verse 1", dramaticFunction: "initiation", order: 0, energyLevel: 20 },
        { id: "sec-2", name: "Chorus", dramaticFunction: "arrival", order: 1, energyLevel: 70 },
        { id: "sec-3", name: "Final Chorus", dramaticFunction: "arrival", order: 2, energyLevel: 70 },
      ],
      repetitionPlan: { exactRepeats: [], surfaceVariations: [], meaningShifts: [] },
    });
    const { warnings } = formFunctionEngine(spec);
    expect(warnings.some((w) => /final chorus doesn't clearly differ/.test(w.message))).toBe(true);
  });

  it("produces formNotes and repetitionNotes", () => {
    const spec = buildValidSpec();
    const { notes } = formFunctionEngine(spec);
    expect(notes.formNotes).toContain("Verse 1");
    expect(notes.repetitionNotes).toMatch(/1 line\(s\)/);
  });
});

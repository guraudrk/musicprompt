import { describe, expect, it } from "vitest";
import { subtractionEngine } from "@/theory/subtractionEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("subtractionEngine", () => {
  it("does not warn for the default (lean) fixture", () => {
    const spec = buildValidSpec();
    const { warnings, notes } = subtractionEngine(spec);
    expect(warnings).toHaveLength(0);
    expect(notes.subtractionNotes).toMatch(/No overload signals/);
  });

  it("warns when too many genres are declared", () => {
    const spec = buildValidSpec({
      musicalIdentity: {
        ...buildValidSpec().musicalIdentity,
        genres: [
          { tag: "pop", weight: 25 },
          { tag: "rock", weight: 25 },
          { tag: "jazz", weight: 25 },
          { tag: "edm", weight: 25 },
        ],
      },
    });
    const { warnings } = subtractionEngine(spec);
    expect(warnings.some((w) => /genres declared/.test(w.message))).toBe(true);
  });

  it("warns when instrumentation and exclusions conflict", () => {
    const spec = buildValidSpec({ exclusions: ["piano"] });
    const { warnings } = subtractionEngine(spec);
    expect(warnings.some((w) => /both requested and excluded/.test(w.message))).toBe(true);
  });

  it("warns when there are too many hook candidates", () => {
    const spec = buildValidSpec({
      hookPlan: {
        candidates: Array.from({ length: 9 }, (_, i) => ({ id: `hook-${i}`, type: "melodic" as const, description: `hook ${i}` })),
        selectedId: "hook-0",
      },
    });
    const { warnings } = subtractionEngine(spec);
    expect(warnings.some((w) => /narrow the tournament/.test(w.message))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { harmonyGravityEngine } from "@/theory/harmonyGravityEngine";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("harmonyGravityEngine", () => {
  it("warns when no harmonic traits are declared", () => {
    const spec = buildValidSpec();
    const { warnings } = harmonyGravityEngine(spec);
    expect(warnings.some((w) => /No harmonic traits declared/.test(w.message))).toBe(true);
  });

  it("warns when no key/mode is declared", () => {
    const spec = buildValidSpec();
    const { warnings } = harmonyGravityEngine(spec);
    expect(warnings.some((w) => /No key\/mode declared/.test(w.message))).toBe(true);
  });

  it("does not warn about key/mode once it is set", () => {
    const spec = buildValidSpec({ musicalIdentity: { ...buildValidSpec().musicalIdentity, keyMode: "D minor" } });
    const { warnings } = harmonyGravityEngine(spec);
    expect(warnings.some((w) => /No key\/mode declared/.test(w.message))).toBe(false);
  });

  it("suggests a harmonic contrast dimension when traits exist but contrastPlan has none", () => {
    const spec = buildValidSpec({
      musicalIdentity: { ...buildValidSpec().musicalIdentity, harmonicTraits: ["modal interchange in the bridge"] },
    });
    const { warnings } = harmonyGravityEngine(spec);
    expect(warnings.some((w) => /no contrastPlan entry uses harmony/.test(w.message))).toBe(true);
  });

  it("produces tensionReleaseNotes only when harmonic traits exist", () => {
    const withTraits = buildValidSpec({
      musicalIdentity: { ...buildValidSpec().musicalIdentity, harmonicTraits: ["tonic resolution in the chorus"] },
    });
    expect(harmonyGravityEngine(withTraits).notes.tensionReleaseNotes).toContain("tonic resolution");
    expect(harmonyGravityEngine(buildValidSpec()).notes.tensionReleaseNotes).toBeUndefined();
  });
});

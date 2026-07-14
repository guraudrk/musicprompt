import { describe, expect, it } from "vitest";
import { runTheoryEngines } from "@/theory/runTheoryEngines";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";

describe("runTheoryEngines", () => {
  it("combines warnings from multiple engines", () => {
    const spec = buildValidSpec();
    const result = runTheoryEngines(spec);

    const engines = new Set(result.engineWarnings.map((w) => w.engine));
    expect(engines.has("MelodyMemoryEngine")).toBe(true);
    expect(engines.has("HarmonyGravityEngine")).toBe(true);
    expect(engines.has("RhythmMomentumEngine")).toBe(true);
    expect(engines.has("ProsodyEngine")).toBe(true);
  });

  it("filters out dismissed warnings by their engine:message key", () => {
    const spec = buildValidSpec();
    const first = runTheoryEngines(spec);
    const toDismiss = first.engineWarnings[0];
    const key = `${toDismiss.engine}:${toDismiss.message}`;

    const specWithDismissal = buildValidSpec({
      compositionTheory: { ...spec.compositionTheory, dismissedWarnings: [key] },
    });
    const second = runTheoryEngines(specWithDismissal);

    expect(second.engineWarnings.some((w) => `${w.engine}:${w.message}` === key)).toBe(false);
    expect(second.dismissedWarnings).toContain(key);
  });

  it("never overwrites a notes field listed in lockedFields", () => {
    const spec = buildValidSpec({
      compositionTheory: { engineWarnings: [], dismissedWarnings: [], formNotes: "Hand-written, do not touch." },
      lockedFields: ["lyricsDesign.lockedLines", "compositionTheory.formNotes"],
    });

    const result = runTheoryEngines(spec);
    expect(result.formNotes).toBe("Hand-written, do not touch.");
  });

  it("regenerates an unlocked notes field fresh even if it already had text", () => {
    const spec = buildValidSpec({
      compositionTheory: { engineWarnings: [], dismissedWarnings: [], formNotes: "Stale text from a previous run." },
    });

    const result = runTheoryEngines(spec);
    expect(result.formNotes).not.toBe("Stale text from a previous run.");
    expect(result.formNotes).toContain("Verse 1");
  });

  it("combines multiple engines' contributions to a shared notes field (tensionReleaseNotes)", () => {
    const spec = buildValidSpec({
      musicalIdentity: {
        ...buildValidSpec().musicalIdentity,
        harmonicTraits: ["modal interchange in the bridge"],
        rhythmicTraits: ["a bar of silence before the chorus"],
      },
    });

    const result = runTheoryEngines(spec);
    expect(result.tensionReleaseNotes).toContain("modal interchange");
    expect(result.tensionReleaseNotes).toContain("Silence/space is used deliberately");
  });
});

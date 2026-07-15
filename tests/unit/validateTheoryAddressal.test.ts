import { describe, expect, it } from "vitest";
import { validateTheoryAddressal } from "@/compiler/validateTheoryAddressal";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { MusicAIPromptPackage, TheoryAddressal } from "@/domain/promptPackage/schema";

function makeTheorySummary(overrides: Partial<CompositionTheorySpec> = {}): CompositionTheorySpec {
  return {
    engineWarnings: [
      { engine: "HarmonyGravityEngine", severity: "info", message: "No harmonic traits declared." },
      { engine: "RhythmMomentumEngine", severity: "warning", message: "No tempo or BPM range declared." },
    ],
    dismissedWarnings: [],
    ...overrides,
  };
}

function makePkg(theoryAddressal: TheoryAddressal[]): MusicAIPromptPackage {
  return { theoryAddressal } as unknown as MusicAIPromptPackage;
}

describe("validateTheoryAddressal (ADR-045: only warning/blocking severity is required)", () => {
  it("passes when the required (warning-severity) entry is addressed, even if the info one is skipped", () => {
    const theorySummary = makeTheorySummary();
    const pkg = makePkg([
      { engine: "RhythmMomentumEngine", message: "No tempo or BPM range declared.", resolution: "Set style to imply an unhurried mid-tempo feel." },
      // HarmonyGravityEngine's info-severity warning is deliberately left unaddressed.
    ]);

    expect(validateTheoryAddressal(theorySummary, pkg)).toEqual([]);
  });

  it("passes when both are addressed (addressing an optional info one is never wrong)", () => {
    const theorySummary = makeTheorySummary();
    const pkg = makePkg([
      { engine: "HarmonyGravityEngine", message: "No harmonic traits declared.", resolution: "Implied a bright major key in the style field." },
      { engine: "RhythmMomentumEngine", message: "No tempo or BPM range declared.", resolution: "Set an unhurried mid-tempo feel." },
    ]);

    expect(validateTheoryAddressal(theorySummary, pkg)).toEqual([]);
  });

  it("catches a missing addressal for a required warning-severity warning", () => {
    const theorySummary = makeTheorySummary();
    const pkg = makePkg([]); // neither addressed — but only the warning-severity one is mandatory

    const errors = validateTheoryAddressal(theorySummary, pkg);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/RhythmMomentumEngine was not addressed/);
  });

  it("catches an invented addressal entry that doesn't match any real warning, regardless of severity", () => {
    const theorySummary = makeTheorySummary();
    const pkg = makePkg([
      { engine: "RhythmMomentumEngine", message: "No tempo or BPM range declared.", resolution: "Addressed." },
      { engine: "ProsodyEngine", message: "A warning that was never actually raised.", resolution: "Made up." },
    ]);

    const errors = validateTheoryAddressal(theorySummary, pkg);
    expect(errors.some((e) => /references a warning that was never raised/.test(e))).toBe(true);
  });

  it("passes trivially when there are no active warnings", () => {
    const theorySummary = makeTheorySummary({ engineWarnings: [] });
    const pkg = makePkg([]);

    expect(validateTheoryAddressal(theorySummary, pkg)).toEqual([]);
  });

  it("passes when all active warnings are info-severity, even with an empty theoryAddressal", () => {
    const theorySummary = makeTheorySummary({
      engineWarnings: [{ engine: "HarmonyGravityEngine", severity: "info", message: "No key/mode declared." }],
    });
    const pkg = makePkg([]);

    expect(validateTheoryAddressal(theorySummary, pkg)).toEqual([]);
  });
});

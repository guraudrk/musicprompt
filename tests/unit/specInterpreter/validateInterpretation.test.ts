import { describe, expect, it } from "vitest";
import { validateInterpretation } from "@/spec-interpreter/validateInterpretation";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";
import type { SpecInterpretation } from "@/domain/songDesignSpec/interpretation";

function baseInterpretation(overrides: Partial<SpecInterpretation> = {}): SpecInterpretation {
  return {
    musicalIdentity: {
      genres: [{ tag: "K-pop", weight: 50 }],
      tempoDescription: "mid-tempo",
      instrumentation: ["male vocal"],
    },
    lyricsDesignMode: "metaphorical",
    rationale: "test",
    fieldProvenance: [
      { fieldPath: "musicalIdentity.genres", origin: "inferred_low_confidence" },
      { fieldPath: "musicalIdentity.tempoDescription", origin: "inferred_low_confidence" },
      { fieldPath: "musicalIdentity.instrumentation", origin: "inferred_low_confidence" },
      { fieldPath: "lyricsDesign.mode", origin: "inferred_low_confidence" },
    ],
    ...overrides,
  };
}

describe("validateInterpretation (deterministic backstop)", () => {
  it("passes through suggestions for a spec with default/empty musicalIdentity", () => {
    const spec = buildDefaultSpec("p1");
    const result = validateInterpretation(spec, baseInterpretation());

    expect(result.musicalIdentity.genres).toEqual([{ tag: "K-pop", weight: 50 }]);
    expect(result.musicalIdentity.tempoDescription).toBe("mid-tempo");
    expect(result.musicalIdentity.instrumentation).toEqual(["male vocal"]);
    expect(result.lyricsDesignMode).toBe("metaphorical");
    expect(result.fieldProvenance).toHaveLength(4);
  });

  it("strips every field that collides with an already non-default spec value", () => {
    const spec = buildValidSpec(); // genres/tempoDescription/instrumentation already set
    spec.lyricsDesign.mode = "hybrid"; // unambiguously non-default (unlike "direct", which is also the default)
    const result = validateInterpretation(spec, baseInterpretation());

    expect(result.musicalIdentity.genres).toBeUndefined();
    expect(result.musicalIdentity.tempoDescription).toBeUndefined();
    expect(result.musicalIdentity.instrumentation).toBeUndefined();
    expect(result.lyricsDesignMode).toBeUndefined();
    expect(result.fieldProvenance).toEqual([]);
  });

  it("drops a suggested field entirely if its fieldProvenance entry is missing (untraceable)", () => {
    const spec = buildDefaultSpec("p1");
    const interpretation = baseInterpretation({ fieldProvenance: [] });
    const result = validateInterpretation(spec, interpretation);

    expect(result.musicalIdentity.genres).toBeUndefined();
    expect(result.musicalIdentity.tempoDescription).toBeUndefined();
    expect(result.musicalIdentity.instrumentation).toBeUndefined();
    expect(result.lyricsDesignMode).toBeUndefined();
    expect(result.fieldProvenance).toEqual([]);
  });

  it("keeps only the fields that both avoid collision and carry provenance", () => {
    const spec = buildDefaultSpec("p1");
    spec.musicalIdentity.tempoDescription = "slow"; // already set — should be excluded regardless of provenance
    const interpretation = baseInterpretation({
      fieldProvenance: [
        { fieldPath: "musicalIdentity.genres", origin: "inferred_high_confidence" },
        // tempoDescription and instrumentation provenance deliberately omitted/colliding
      ],
    });
    const result = validateInterpretation(spec, interpretation);

    expect(result.musicalIdentity.genres).toEqual([{ tag: "K-pop", weight: 50 }]);
    expect(result.musicalIdentity.tempoDescription).toBeUndefined();
    expect(result.musicalIdentity.instrumentation).toBeUndefined();
    expect(result.fieldProvenance).toEqual([{ fieldPath: "musicalIdentity.genres", origin: "inferred_high_confidence" }]);
  });
});

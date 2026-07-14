import { describe, expect, it } from "vitest";
import { SongDesignSpecSchema } from "@/domain/songDesignSpec/schema";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

describe("SongDesignSpecSchema", () => {
  it("accepts a fully valid spec", () => {
    const result = SongDesignSpecSchema.safeParse(buildValidSpec());
    expect(result.success).toBe(true);
  });

  it("rejects a spec missing a required North Star field", () => {
    const spec = buildValidSpec();
    // @ts-expect-error intentionally malformed for the test
    delete spec.northStar.finalAftertaste;

    const result = SongDesignSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });

  it("rejects a spec with a reference but fewer than 3 deliberate differences", () => {
    const spec = buildValidSpec({
      reference: {
        userReason: "Loved the emotional build.",
        surfaceTraits: [],
        functionalPrinciples: [],
        similarityGuardrails: [],
      },
      deliberateDifferences: [{ id: "diff-1", dimension: "genre", fromReference: "rock", toNew: "ballad" }],
    });

    const result = SongDesignSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join(".") === "deliberateDifferences")).toBe(true);
    }
  });

  it("accepts a spec with a reference and 3+ deliberate differences", () => {
    const spec = buildValidSpec({
      reference: {
        userReason: "Loved the emotional build.",
        surfaceTraits: [],
        functionalPrinciples: [],
        similarityGuardrails: [],
      },
    });

    const result = SongDesignSpecSchema.safeParse(spec);
    expect(result.success).toBe(true);
  });

  it("rejects malformed field provenance", () => {
    const spec = buildValidSpec({
      // @ts-expect-error intentionally invalid origin value for the test
      provenance: [{ fieldPath: "northStar.audienceExperience", origin: "made_up_origin" }],
    });

    const result = SongDesignSpecSchema.safeParse(spec);
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { buildSpecInterpretation } from "@/llm/mock/specInterpretationBuilder";
import { buildValidSpec } from "../fixtures/songDesignSpec.fixture";
import { buildDefaultSpec } from "@/domain/songDesignSpec/defaultSpec";

describe("buildSpecInterpretation (deterministic Mock spec interpreter)", () => {
  it("suggests genre/tempo/vocal from North Star text when musicalIdentity is still default", () => {
    const spec = buildDefaultSpec("p1");
    spec.northStar.audienceExperience = "기차역에서의 씁쓸한 이별 노래, kpop 락발라드 형식, 미드 템포, 남자 가수";

    const interpretation = buildSpecInterpretation({ spec });

    expect(interpretation.musicalIdentity.genres?.map((g) => g.tag)).toEqual(
      expect.arrayContaining(["K-pop", "Rock", "Ballad"]),
    );
    expect(interpretation.musicalIdentity.tempoDescription).toBe("mid-tempo");
    expect(interpretation.musicalIdentity.instrumentation).toEqual(["male vocal"]);
    expect(interpretation.fieldProvenance.length).toBeGreaterThan(0);
    expect(interpretation.fieldProvenance.every((p) => p.origin === "inferred_low_confidence")).toBe(true);
  });

  it("never suggests a field that already has a non-default value in the spec", () => {
    const spec = buildValidSpec(); // genres/tempoDescription/instrumentation already set
    spec.northStar.audienceExperience = "kpop rock ballad, mid-tempo, male vocal";

    const interpretation = buildSpecInterpretation({ spec });

    expect(interpretation.musicalIdentity.genres).toBeUndefined();
    expect(interpretation.musicalIdentity.tempoDescription).toBeUndefined();
    expect(interpretation.musicalIdentity.instrumentation).toBeUndefined();
    expect(interpretation.fieldProvenance).toEqual([]);
  });

  it("returns an honest empty result for genuinely vague input with no recognizable keywords", () => {
    const spec = buildDefaultSpec("p1");
    spec.northStar.audienceExperience = "something I feel deeply about, please help";

    const interpretation = buildSpecInterpretation({ spec });

    expect(interpretation.musicalIdentity.genres).toBeUndefined();
    expect(interpretation.musicalIdentity.tempoDescription).toBeUndefined();
    expect(interpretation.fieldProvenance).toEqual([]);
    expect(interpretation.rationale).toMatch(/no confident/i);
  });

  it("suggests a lyrics mode when the text implies metaphor or directness", () => {
    const spec = buildDefaultSpec("p1");
    spec.northStar.audienceExperience = "은유적으로 표현된 이별 노래";

    const interpretation = buildSpecInterpretation({ spec });

    expect(interpretation.lyricsDesignMode).toBe("metaphorical");
  });
});

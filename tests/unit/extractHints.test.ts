import { describe, expect, it } from "vitest";
import { extractHints } from "@/app/api/demo/compile/extractHints";

describe("extractHints (deterministic keyword matching, not AI/classification)", () => {
  it("extracts Korean genre/tempo/vocal keywords", () => {
    const hints = extractHints("기차역에서의 씁쓸한 이별 노래, kpop 락발라드 형식, 미드 템포, 남자 가수");
    expect(hints.genres).toEqual(expect.arrayContaining(["K-pop", "Rock", "Ballad"]));
    expect(hints.tempo).toBe("mid-tempo");
    expect(hints.vocal).toBe("male vocal");
  });

  it("extracts English keywords", () => {
    const hints = extractHints("An up-tempo hip-hop track with a female vocal");
    expect(hints.genres).toEqual(["Hip-hop"]);
    expect(hints.tempo).toBe("up-tempo");
    expect(hints.vocal).toBe("female vocal");
  });

  it("extracts Japanese keywords", () => {
    const hints = extractHints("ミディアムテンポのジャズ、男性ボーカル");
    expect(hints.genres).toEqual(["Jazz"]);
    expect(hints.tempo).toBe("mid-tempo");
    expect(hints.vocal).toBe("male vocal");
  });

  it("returns empty/undefined hints when no keywords are present", () => {
    const hints = extractHints("something I feel deeply about, please help");
    expect(hints.genres).toEqual([]);
    expect(hints.tempo).toBeUndefined();
    expect(hints.vocal).toBeUndefined();
  });

  it("de-duplicates repeated genre mentions", () => {
    const hints = extractHints("pop pop pop song, very poppy");
    expect(hints.genres).toEqual(["Pop"]);
  });
});

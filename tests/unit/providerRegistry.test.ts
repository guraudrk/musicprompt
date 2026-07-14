import { describe, expect, it } from "vitest";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

describe("InMemoryProviderRegistry", () => {
  const registry = new InMemoryProviderRegistry();

  it("lists the generic, suno, and udio profiles", () => {
    const ids = registry.list().map((p) => p.providerId);
    expect(ids).toEqual(expect.arrayContaining(["generic", "suno", "udio"]));
  });

  it("gets a profile by id", () => {
    expect(registry.get("suno")?.displayName).toBe("Suno");
    expect(registry.get("does-not-exist")).toBeUndefined();
  });

  it("recommends providers ranked by score, never omitting a provider", () => {
    const recommendations = registry.recommend(buildValidSpec());
    expect(recommendations).toHaveLength(3);
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
    }
  });
});

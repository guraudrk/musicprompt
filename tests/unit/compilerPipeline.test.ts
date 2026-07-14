import { describe, expect, it } from "vitest";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { MockPromptCompiler } from "@/llm/mock/mockPromptCompiler";
import { MockPromptEvaluator } from "@/llm/mock/mockPromptEvaluator";
import { compileAllStrategies, compilePromptPackage } from "@/compiler/pipeline";
import { MusicAIPromptPackageSchema } from "@/domain/promptPackage/schema";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";

function makeDeps() {
  return {
    registry: new InMemoryProviderRegistry(),
    compiler: new MockPromptCompiler(),
    evaluator: new MockPromptEvaluator(),
  };
}

describe("Mock compile pipeline (Stage A-H)", () => {
  it("is deterministic: same input produces the same output", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    const first = await compilePromptPackage(spec, "suno", "balanced", deps);
    const second = await compilePromptPackage(spec, "suno", "balanced", deps);

    expect(first.package).toEqual(second.package);
  });

  it("preserves locked lyric lines through compile", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    const { package: pkg } = await compilePromptPackage(spec, "suno", "safe", deps);

    for (const line of spec.lyricsDesign.lockedLines) {
      expect(pkg.fields.lyrics ?? "").toContain(line);
    }
  });

  it("preserves unsupported intents instead of silently dropping them", async () => {
    const spec = buildValidSpec({ identity: { ...buildValidSpec().identity, language: "Korean", instrumental: false } });
    const deps = makeDeps();

    // Force a provider that does not support multilingual lyrics or custom lyrics.
    const registry = new InMemoryProviderRegistry([
      {
        ...deps.registry.get("suno")!,
        capabilities: { ...deps.registry.get("suno")!.capabilities, multilingualLyrics: "false", customLyrics: "false" },
      },
    ]);

    const { package: pkg } = await compilePromptPackage(spec, "suno", "safe", { ...deps, registry });

    expect(pkg.unsupportedIntents.length).toBeGreaterThan(0);
    expect(pkg.unsupportedIntents.map((i) => i.intent)).toEqual(
      expect.arrayContaining(["custom lyrics", "lyrics in Korean"]),
    );
  });

  it("produces meaningfully different Safe / Balanced / Bold packages", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    const { safe, balanced, bold } = await compileAllStrategies(spec, "suno", deps);

    expect(safe.package.fields.style).not.toBe(balanced.package.fields.style);
    expect(balanced.package.fields.style).not.toBe(bold.package.fields.style);
    expect(safe.package.fields.guidanceTags).not.toEqual(bold.package.fields.guidanceTags);
  });

  it("produces a package that validates against the shared MusicAIPromptPackage schema", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    const { package: pkg } = await compilePromptPackage(spec, "generic", "balanced", deps);

    const result = MusicAIPromptPackageSchema.safeParse(pkg);
    expect(result.success).toBe(true);
  });

  it("throws a clear error for an unknown provider id", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    await expect(compilePromptPackage(spec, "does-not-exist", "safe", deps)).rejects.toThrow(/Unknown provider/);
  });

  it("reports compile-call metadata (Phase 3, IMPLEMENTATION_PLAN.md §3.6)", async () => {
    const spec = buildValidSpec();
    const deps = makeDeps();

    const { metadata, repaired } = await compilePromptPackage(spec, "generic", "safe", deps);

    expect(metadata).toEqual({
      model: "mock",
      apiMode: "mock",
      promptTemplateVersion: "n/a",
      schemaVersion: "1",
      latencyMs: expect.any(Number),
      repairCount: 0,
    });
    expect(repaired).toBe(false);
    expect(metadata.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

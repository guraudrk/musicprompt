import { describe, expect, it } from "vitest";
import {
  buildTheoryRationale,
  buildToolInstructions,
  buildWarningsList,
  buildCopyBundle,
  placeholderQuality,
  assembleFullPackage,
} from "@/compiler/deterministicFields";
import { buildValidSpec } from "./fixtures/songDesignSpec.fixture";
import { InMemoryProviderRegistry } from "@/providers/registry";
import { runTheoryEngines } from "@/theory/runTheoryEngines";
import type { CompilerOutput } from "@/domain/promptPackage/schema";

const provider = new InMemoryProviderRegistry().get("generic")!;

describe("deterministicFields (ADR-050)", () => {
  it("buildTheoryRationale mechanically extracts every field from the spec", () => {
    const spec = buildValidSpec();
    const rationale = buildTheoryRationale(spec);

    expect(rationale.northStar).toBe(spec.northStar.audienceExperience);
    expect(rationale.selectedCore).toBe(spec.generativeCore.combinedCore);
    expect(rationale.deliberateDifferences).toEqual(
      spec.deliberateDifferences.map((d) => `${d.dimension}: ${d.fromReference} -> ${d.toNew}`),
    );
    expect(rationale.form).toBe(spec.structure.map((s) => s.name).join(" > "));
    expect(rationale.contrast).toEqual(spec.contrastPlan.map((c) => c.description));
    expect(rationale.hook).toBe("\"I never found the one who broke me.\"");
    expect(rationale.repetition).toBe(spec.repetitionPlan.meaningShifts.map((m) => m.line).join("; "));
    expect(rationale.lyrics).toBe(spec.lyricsDesign.mode);
  });

  it("buildToolInstructions produces a provider-specific one-liner", () => {
    expect(buildToolInstructions(provider)).toEqual([`Paste the fields above into ${provider.displayName}.`]);
  });

  it("buildWarningsList echoes engine warning messages verbatim", () => {
    const spec = buildValidSpec();
    const theorySummary = runTheoryEngines(spec);
    expect(buildWarningsList(theorySummary)).toEqual(theorySummary.engineWarnings.map((w) => w.message));
  });

  it("buildCopyBundle reads from the actual returned fields, not from spec independently", () => {
    const bundle = buildCopyBundle(
      { title: "My Title", style: "warm indie pop", lyrics: "la la la", negativePrompt: "no rap" },
      "Fallback Title",
    );
    expect(bundle).toBe("Title: My Title\n\nStyle: warm indie pop\n\nLyrics:\nla la la\n\nExclude: no rap");
  });

  it("buildCopyBundle falls back to workingTitle and 'none'/'Untitled' when fields are sparse", () => {
    const bundle = buildCopyBundle({}, "Fallback Title");
    expect(bundle).toBe("Title: Fallback Title\n\nStyle: \n\nLyrics:\n\n\nExclude: none");
  });

  it("placeholderQuality returns a neutral, clearly-labeled-as-pending report", () => {
    const quality = placeholderQuality("balanced");
    expect(quality.strategy).toBe("balanced");
    expect(quality.scores.clarity).toBe(50);
    expect(quality.overallNotes).toMatch(/pending/i);
  });

  it("assembleFullPackage combines provider metadata + deterministic fields + the creative output", () => {
    const spec = buildValidSpec();
    const theorySummary = runTheoryEngines(spec);
    const output: CompilerOutput = {
      genericDesignSummary: "test summary",
      fields: { style: "test style", lyrics: "I never found the one who broke me." },
      unsupportedIntents: [],
      revisionLevers: [],
      theoryAddressal: [],
    };

    const pkg = assembleFullPackage(spec, provider, "balanced", theorySummary, output);

    expect(pkg.providerId).toBe(provider.providerId);
    expect(pkg.providerDisplayName).toBe(provider.displayName);
    expect(pkg.strategy).toBe("balanced");
    expect(pkg.fields.style).toBe("test style");
    expect(pkg.theoryRationale.northStar).toBe(spec.northStar.audienceExperience);
    expect(pkg.toolInstructions).toEqual([`Paste the fields above into ${provider.displayName}.`]);
    expect(pkg.copyBundle).toContain("test style");
    expect(pkg.promptQuality.overallNotes).toMatch(/pending/i);
  });
});

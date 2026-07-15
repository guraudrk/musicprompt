"use client";

import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { LyricsMode } from "@/domain/songDesignSpec/lyrics";
import type { MusicAIPromptPackage } from "@/domain/promptPackage/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { LyricsDraft } from "@/domain/lyrics/draft";
import type { SpecInterpretation } from "@/domain/songDesignSpec/interpretation";
import type { ReferenceTrait, ReferencePrinciple } from "@/domain/songDesignSpec/reference";
import type { DeliberateDifference, DeliberateDifferenceDimension } from "@/domain/songDesignSpec/difference";
import { MINIMUM_DELIBERATE_DIFFERENCES } from "@/domain/songDesignSpec/difference";
import type { DramaticSection, EmotionPoint } from "@/domain/songDesignSpec/structure";
import { diffLines } from "@/lib/diffLines";

const LYRICS_MODES: LyricsMode[] = [
  "simple_direct",
  "direct",
  "metaphorical",
  "narrative",
  "conversational",
  "image_driven",
  "hybrid",
  "preserve_original",
];

const PROVIDER_IDS = ["generic", "suno", "udio"] as const;

const DIMENSIONS: DeliberateDifferenceDimension[] = [
  "genre",
  "theme",
  "narrator",
  "conflict",
  "ending",
  "vocalDelivery",
  "instrumentation",
  "rhythmicCharacter",
  "hookType",
  "emotionCurve",
  "eraTexture",
  "other",
];

function makeId(): string {
  return crypto.randomUUID();
}

type FunctionalPrincipleRow = ReferencePrinciple & { appliesToText: string };

type CompareResult = { safe: MusicAIPromptPackage; balanced: MusicAIPromptPackage; bold: MusicAIPromptPackage };

type HistoryEntry = {
  id: string;
  strategy: string;
  providerId: string;
  model: string;
  apiMode: string;
  style: string | null;
  lyrics: string | null;
  createdAt: string;
};

function splitList(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ProjectEditor({ project }: { project: Project }) {
  const [current, setCurrent] = useState<Project>(project);
  const spec = current.spec;

  const [workingTitle, setWorkingTitle] = useState(spec.identity.workingTitle ?? "");
  const [purpose, setPurpose] = useState(spec.identity.purpose);
  const [language, setLanguage] = useState(spec.identity.language);
  const [instrumental, setInstrumental] = useState(spec.identity.instrumental);

  const [audienceExperience, setAudienceExperience] = useState(spec.northStar.audienceExperience);
  const [finalAftertaste, setFinalAftertaste] = useState(spec.northStar.finalAftertaste);
  const [nonNegotiableCore, setNonNegotiableCore] = useState(spec.northStar.nonNegotiableCore);

  const [genresText, setGenresText] = useState(spec.musicalIdentity.genres.map((g) => g.tag).join(", "));
  const [tempoDescription, setTempoDescription] = useState(spec.musicalIdentity.tempoDescription);
  const [instrumentationText, setInstrumentationText] = useState(spec.musicalIdentity.instrumentation.join(", "));
  const [vocalDescription, setVocalDescription] = useState(spec.musicalIdentity.vocalDescription ?? "");

  const [lyricsMode, setLyricsMode] = useState<LyricsMode>(spec.lyricsDesign.mode);
  const [originalLyrics, setOriginalLyrics] = useState(spec.lyricsDesign.originalLyrics ?? "");
  const [lockedLinesText, setLockedLinesText] = useState(spec.lyricsDesign.lockedLines.join("\n"));

  const [hasReference, setHasReference] = useState(!!spec.reference);
  const [refSongTitle, setRefSongTitle] = useState(spec.reference?.songTitle ?? "");
  const [refArtistName, setRefArtistName] = useState(spec.reference?.artistName ?? "");
  const [refUserReason, setRefUserReason] = useState(spec.reference?.userReason ?? "");
  const [surfaceTraits, setSurfaceTraits] = useState<ReferenceTrait[]>(spec.reference?.surfaceTraits ?? []);
  const [functionalPrinciples, setFunctionalPrinciples] = useState<FunctionalPrincipleRow[]>(
    (spec.reference?.functionalPrinciples ?? []).map((p) => ({ ...p, appliesToText: (p.appliesTo ?? []).join(", ") })),
  );
  const [similarityGuardrailsText, setSimilarityGuardrailsText] = useState(
    (spec.reference?.similarityGuardrails ?? []).join(", "),
  );
  const [deliberateDifferences, setDeliberateDifferences] = useState<DeliberateDifference[]>(spec.deliberateDifferences);

  const [structure, setStructure] = useState<DramaticSection[]>(spec.structure);
  const [emotionCurve, setEmotionCurve] = useState<EmotionPoint[]>(spec.emotionCurve);

  const [exclusionsText, setExclusionsText] = useState(spec.exclusions.join(", "));
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>(spec.providerSelection.selectedProviderIds);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [compiling, setCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [results, setResults] = useState<CompareResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [theory, setTheory] = useState<CompositionTheorySpec | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<LyricsDraft[] | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [diffTarget, setDiffTarget] = useState<LyricsDraft | null>(null);

  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const [interpretation, setInterpretation] = useState<SpecInterpretation | null>(null);
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState<string | null>(null);

  function addSurfaceTrait() {
    setSurfaceTraits((rows) => [...rows, { id: makeId(), description: "" }]);
  }
  function updateSurfaceTrait(id: string, description: string) {
    setSurfaceTraits((rows) => rows.map((r) => (r.id === id ? { ...r, description } : r)));
  }
  function removeSurfaceTrait(id: string) {
    setSurfaceTraits((rows) => rows.filter((r) => r.id !== id));
  }

  function addFunctionalPrinciple() {
    setFunctionalPrinciples((rows) => [...rows, { id: makeId(), description: "", appliesToText: "" }]);
  }
  function updateFunctionalPrinciple(id: string, field: "description" | "appliesToText", value: string) {
    setFunctionalPrinciples((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeFunctionalPrinciple(id: string) {
    setFunctionalPrinciples((rows) => rows.filter((r) => r.id !== id));
  }

  function addDeliberateDifference() {
    setDeliberateDifferences((rows) => [
      ...rows,
      { id: makeId(), dimension: "other", fromReference: "", toNew: "" },
    ]);
  }
  function updateDeliberateDifference(id: string, field: keyof DeliberateDifference, value: string) {
    setDeliberateDifferences((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeDeliberateDifference(id: string) {
    setDeliberateDifferences((rows) => rows.filter((r) => r.id !== id));
  }

  function addStructureSection() {
    setStructure((rows) => [
      ...rows,
      { id: makeId(), name: "", dramaticFunction: "", order: rows.length, energyLevel: 50 },
    ]);
  }
  function updateStructureSection(id: string, field: keyof DramaticSection, value: string | number | undefined) {
    setStructure((rows) => rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function removeStructureSection(id: string) {
    setStructure((rows) => rows.filter((r) => r.id !== id));
  }
  function moveStructureSection(index: number, direction: -1 | 1) {
    setStructure((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addEmotionPoint() {
    setEmotionCurve((rows) => [...rows, { position: 0, energy: 50, tension: 50 }]);
  }
  function updateEmotionPoint(index: number, field: keyof EmotionPoint, value: number | undefined) {
    setEmotionCurve((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }
  function removeEmotionPoint(index: number) {
    setEmotionCurve((rows) => rows.filter((_, i) => i !== index));
  }

  function buildSpecFromForm(base: SongDesignSpec): SongDesignSpec {
    return {
      ...base,
      identity: { ...base.identity, workingTitle: workingTitle || undefined, purpose, language, instrumental },
      northStar: { ...base.northStar, audienceExperience, finalAftertaste, nonNegotiableCore },
      musicalIdentity: {
        ...base.musicalIdentity,
        genres: splitList(genresText).map((tag) => ({ tag, weight: 50 })),
        tempoDescription,
        instrumentation: splitList(instrumentationText),
        vocalDescription: vocalDescription || undefined,
      },
      lyricsDesign: {
        ...base.lyricsDesign,
        mode: lyricsMode,
        originalLyrics: originalLyrics || undefined,
        lockedLines: splitList(lockedLinesText),
      },
      exclusions: splitList(exclusionsText),
      providerSelection: { ...base.providerSelection, selectedProviderIds },
      reference: hasReference
        ? {
            songTitle: refSongTitle || undefined,
            artistName: refArtistName || undefined,
            userReason: refUserReason,
            surfaceTraits,
            functionalPrinciples: functionalPrinciples.map(({ appliesToText, ...p }) => ({
              ...p,
              appliesTo: splitList(appliesToText),
            })),
            similarityGuardrails: splitList(similarityGuardrailsText),
          }
        : undefined,
      deliberateDifferences,
      structure: structure.map((s, i) => ({ ...s, order: i })),
      emotionCurve,
    };
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);

    const nextSpec = buildSpecFromForm(current.spec);
    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSpec),
    });

    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Save failed." }));
      const issues = Array.isArray(body.issues) ? body.issues.map((i: { message: string }) => i.message).join(" ") : "";
      setSaveError([body.error, issues].filter(Boolean).join(" — ") || "Save failed.");
      return;
    }
    const { project: updated } = await response.json();
    setCurrent(updated);
  }

  async function handleCompile() {
    setCompiling(true);
    setCompileError(null);
    setResults(null);

    const providerId = selectedProviderIds[0] ?? "generic";
    const response = await fetch(`/api/projects/${project.id}/compile/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ providerId }),
    });

    setCompiling(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Compile failed." }));
      setCompileError(body.error ?? "Compile failed.");
      return;
    }
    setResults(await response.json());
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);

    const response = await fetch(`/api/projects/${project.id}/analyze`, { method: "POST" });

    setAnalyzing(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Analyze failed." }));
      setAnalyzeError(body.error ?? "Analyze failed.");
      return;
    }
    const { compositionTheory } = await response.json();
    setTheory(compositionTheory);
  }

  async function handleDismiss(engine: string, message: string) {
    const key = `${engine}:${message}`;
    const updatedSpec: SongDesignSpec = {
      ...buildSpecFromForm(current.spec),
      compositionTheory: {
        ...current.spec.compositionTheory,
        dismissedWarnings: [...current.spec.compositionTheory.dismissedWarnings, key],
      },
    };

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSpec),
    });
    if (!response.ok) return;

    const { project: updated } = await response.json();
    setCurrent(updated);
    await handleAnalyze();
  }

  async function handleInterpretSpec() {
    setInterpreting(true);
    setInterpretError(null);
    setInterpretation(null);

    const response = await fetch(`/api/projects/${project.id}/spec/interpret`, { method: "POST" });

    setInterpreting(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Spec interpretation failed." }));
      setInterpretError(body.error ?? "Spec interpretation failed.");
      return;
    }
    const { interpretation: result } = await response.json();
    setInterpretation(result);
  }

  function handleApplyInterpretation() {
    if (!interpretation) return;
    const { genres, tempoDescription: suggestedTempo, instrumentation, vocalDescription: suggestedVocal } =
      interpretation.musicalIdentity;

    if (genres && genres.length > 0) setGenresText(genres.map((g) => g.tag).join(", "));
    if (suggestedTempo) setTempoDescription(suggestedTempo);
    if (instrumentation && instrumentation.length > 0) setInstrumentationText(instrumentation.join(", "));
    if (suggestedVocal) setVocalDescription(suggestedVocal);
    if (interpretation.lyricsDesignMode) setLyricsMode(interpretation.lyricsDesignMode);

    setInterpretation(null);
  }

  function handleDiscardInterpretation() {
    setInterpretation(null);
  }

  async function handleGenerateDrafts() {
    setDrafting(true);
    setDraftError(null);
    setDiffTarget(null);

    const response = await fetch(`/api/projects/${project.id}/lyrics/draft`, { method: "POST" });

    setDrafting(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Draft generation failed." }));
      setDraftError(body.error ?? "Draft generation failed.");
      return;
    }
    const { drafts: newDrafts } = await response.json();
    setDrafts(newDrafts);
  }

  async function handleApplyDraft(draft: LyricsDraft) {
    const baseSpec = buildSpecFromForm(current.spec);
    const updatedSpec: SongDesignSpec = {
      ...baseSpec,
      lyricsDesign: { ...baseSpec.lyricsDesign, originalLyrics: draft.lyrics, workflowStage: "draft" },
    };

    const response = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSpec),
    });
    if (!response.ok) return;

    const { project: updated } = await response.json();
    setCurrent(updated);
    setOriginalLyrics(draft.lyrics);
    setDiffTarget(null);
  }

  async function handleLoadHistory() {
    setLoadingHistory(true);
    setHistoryError(null);

    const response = await fetch(`/api/projects/${project.id}/history`);

    setLoadingHistory(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Couldn't load history." }));
      setHistoryError(body.error ?? "Couldn't load history.");
      return;
    }
    const { history: entries } = await response.json();
    setHistory(entries);
  }

  async function copyToClipboard(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      setCompileError("Couldn't copy to clipboard. Your browser may be blocking clipboard access.");
    }
  }

  function toggleProvider(providerId: string) {
    setSelectedProviderIds((ids) =>
      ids.includes(providerId) ? ids.filter((id) => id !== providerId) : [...ids, providerId],
    );
  }

  return (
    <main style={{ maxWidth: "44rem", margin: "3rem auto", padding: "0 1rem" }}>
      <h1>{workingTitle || "Untitled project"}</h1>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>Version {current.currentVersion}</p>

      <section>
        <h2>Identity</h2>
        <label>
          Working title
          <input value={workingTitle} onChange={(e) => setWorkingTitle(e.target.value)} />
        </label>
        <label>
          Purpose
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </label>
        <label>
          Language
          <input value={language} onChange={(e) => setLanguage(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={instrumental} onChange={(e) => setInstrumental(e.target.checked)} />
          Instrumental (no lyrics)
        </label>
      </section>

      <section>
        <h2>North Star</h2>
        <label>
          Audience experience
          <textarea value={audienceExperience} onChange={(e) => setAudienceExperience(e.target.value)} />
        </label>
        <label>
          Final aftertaste
          <textarea value={finalAftertaste} onChange={(e) => setFinalAftertaste(e.target.value)} />
        </label>
        <label>
          Non-negotiable core
          <textarea value={nonNegotiableCore} onChange={(e) => setNonNegotiableCore(e.target.value)} />
        </label>
      </section>

      <section>
        <h2>Reference &amp; deliberate differences</h2>
        <label>
          <input type="checkbox" checked={hasReference} onChange={(e) => setHasReference(e.target.checked)} />
          Has a reference song
        </label>

        {hasReference && (
          <>
            <label>
              Reference song title
              <input value={refSongTitle} onChange={(e) => setRefSongTitle(e.target.value)} />
            </label>
            <label>
              Reference artist name
              <input value={refArtistName} onChange={(e) => setRefArtistName(e.target.value)} />
            </label>
            <label>
              Why this reference
              <input value={refUserReason} onChange={(e) => setRefUserReason(e.target.value)} />
            </label>

            <h3>Surface traits (never carried into output)</h3>
            {surfaceTraits.map((trait) => (
              <div key={trait.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <input
                  value={trait.description}
                  onChange={(e) => updateSurfaceTrait(trait.id, e.target.value)}
                  placeholder="e.g. signature riff"
                  style={{ flex: 1 }}
                />
                <button onClick={() => removeSurfaceTrait(trait.id)}>Remove</button>
              </div>
            ))}
            <button onClick={addSurfaceTrait}>Add surface trait</button>

            <h3>Functional principles (may be carried forward)</h3>
            {functionalPrinciples.map((p) => (
              <div key={p.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <input
                  value={p.description}
                  onChange={(e) => updateFunctionalPrinciple(p.id, "description", e.target.value)}
                  placeholder="e.g. restrained verse vs. expanded chorus"
                  style={{ flex: 1 }}
                />
                <input
                  value={p.appliesToText}
                  onChange={(e) => updateFunctionalPrinciple(p.id, "appliesToText", e.target.value)}
                  placeholder="applies to (comma-separated)"
                  style={{ flex: 1 }}
                />
                <button onClick={() => removeFunctionalPrinciple(p.id)}>Remove</button>
              </div>
            ))}
            <button onClick={addFunctionalPrinciple}>Add functional principle</button>

            <label>
              Similarity guardrails (comma-separated)
              <input value={similarityGuardrailsText} onChange={(e) => setSimilarityGuardrailsText(e.target.value)} />
            </label>

            <h3>
              Deliberate differences ({deliberateDifferences.length} / {MINIMUM_DELIBERATE_DIFFERENCES} minimum)
            </h3>
            {deliberateDifferences.map((d) => (
              <div key={d.id} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <select
                  value={d.dimension}
                  onChange={(e) => updateDeliberateDifference(d.id, "dimension", e.target.value)}
                >
                  {DIMENSIONS.map((dim) => (
                    <option key={dim} value={dim}>
                      {dim}
                    </option>
                  ))}
                </select>
                <input
                  value={d.fromReference}
                  onChange={(e) => updateDeliberateDifference(d.id, "fromReference", e.target.value)}
                  placeholder="from reference"
                  style={{ flex: 1 }}
                />
                <input
                  value={d.toNew}
                  onChange={(e) => updateDeliberateDifference(d.id, "toNew", e.target.value)}
                  placeholder="to new"
                  style={{ flex: 1 }}
                />
                <button onClick={() => removeDeliberateDifference(d.id)}>Remove</button>
              </div>
            ))}
            <button onClick={addDeliberateDifference}>Add deliberate difference</button>
          </>
        )}
      </section>

      <section>
        <h2>Musical identity</h2>
        <label>
          Genres (comma-separated)
          <input value={genresText} onChange={(e) => setGenresText(e.target.value)} />
        </label>
        <label>
          Tempo description
          <input value={tempoDescription} onChange={(e) => setTempoDescription(e.target.value)} />
        </label>
        <label>
          Instrumentation (comma-separated)
          <input value={instrumentationText} onChange={(e) => setInstrumentationText(e.target.value)} />
        </label>
        <label>
          Vocal description
          <input value={vocalDescription} onChange={(e) => setVocalDescription(e.target.value)} />
        </label>
      </section>

      <section>
        <h2>Structure &amp; emotion curve</h2>

        <h3>Structure</h3>
        {structure.map((s, i) => (
          <div key={s.id} style={{ border: "1px solid currentColor", padding: "0.5rem", marginBottom: "0.5rem" }}>
            <label>
              Section name
              <input value={s.name} onChange={(e) => updateStructureSection(s.id, "name", e.target.value)} />
            </label>
            <label>
              Dramatic function
              <input
                value={s.dramaticFunction}
                onChange={(e) => updateStructureSection(s.id, "dramaticFunction", e.target.value)}
                placeholder="e.g. initiation, buildup, arrival, contrast"
              />
            </label>
            <label>
              Energy level (0-100)
              <input
                type="number"
                min={0}
                max={100}
                value={s.energyLevel}
                onChange={(e) => updateStructureSection(s.id, "energyLevel", Number(e.target.value))}
              />
            </label>
            <label>
              Length (bars, optional)
              <input
                type="number"
                min={1}
                value={s.lengthBars ?? ""}
                onChange={(e) => updateStructureSection(s.id, "lengthBars", e.target.value ? Number(e.target.value) : undefined)}
              />
            </label>
            <label>
              Notes (optional)
              <input value={s.notes ?? ""} onChange={(e) => updateStructureSection(s.id, "notes", e.target.value)} />
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={() => moveStructureSection(i, -1)} disabled={i === 0}>
                Move up
              </button>
              <button onClick={() => moveStructureSection(i, 1)} disabled={i === structure.length - 1}>
                Move down
              </button>
              <button onClick={() => removeStructureSection(s.id)}>Remove</button>
            </div>
          </div>
        ))}
        <button onClick={addStructureSection}>Add section</button>

        <h3>Emotion curve</h3>
        {emotionCurve.map((point, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem", alignItems: "center" }}>
            <label>
              Position
              <input
                type="number"
                min={0}
                max={100}
                value={point.position}
                onChange={(e) => updateEmotionPoint(i, "position", Number(e.target.value))}
              />
            </label>
            <label>
              Energy
              <input
                type="number"
                min={0}
                max={100}
                value={point.energy}
                onChange={(e) => updateEmotionPoint(i, "energy", Number(e.target.value))}
              />
            </label>
            <label>
              Tension
              <input
                type="number"
                min={0}
                max={100}
                value={point.tension}
                onChange={(e) => updateEmotionPoint(i, "tension", Number(e.target.value))}
              />
            </label>
            <label>
              Valence (optional)
              <input
                type="number"
                min={0}
                max={100}
                value={point.valence ?? ""}
                onChange={(e) => updateEmotionPoint(i, "valence", e.target.value ? Number(e.target.value) : undefined)}
              />
            </label>
            <button onClick={() => removeEmotionPoint(i)}>Remove</button>
          </div>
        ))}
        <button onClick={addEmotionPoint}>Add emotion point</button>
      </section>

      <section>
        <h2>Lyrics</h2>
        <label>
          Mode
          <select value={lyricsMode} onChange={(e) => setLyricsMode(e.target.value as LyricsMode)}>
            {LYRICS_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lyrics text
          <textarea rows={6} value={originalLyrics} onChange={(e) => setOriginalLyrics(e.target.value)} />
        </label>
        <label>
          Locked lines (one per line — preserved through compile and revision)
          <textarea rows={3} value={lockedLinesText} onChange={(e) => setLockedLinesText(e.target.value)} />
        </label>
      </section>

      <section>
        <h2>Exclusions (comma-separated)</h2>
        <input value={exclusionsText} onChange={(e) => setExclusionsText(e.target.value)} />
      </section>

      <section>
        <h2>Providers</h2>
        {PROVIDER_IDS.map((id) => (
          <label key={id} style={{ marginRight: "1rem" }}>
            <input
              type="checkbox"
              checked={selectedProviderIds.includes(id)}
              onChange={() => toggleProvider(id)}
            />
            {id}
          </label>
        ))}
      </section>

      <div style={{ display: "flex", gap: "0.75rem", margin: "1.5rem 0" }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={handleCompile} disabled={compiling}>
          {compiling ? "Compiling..." : "Compile (Safe / Balanced / Bold)"}
        </button>
        <button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? "Analyzing..." : "Analyze (theory check)"}
        </button>
        <button onClick={handleInterpretSpec} disabled={interpreting}>
          {interpreting ? "Interpreting..." : "Suggest style from North Star (AI)"}
        </button>
        <button onClick={handleGenerateDrafts} disabled={drafting}>
          {drafting ? "Drafting..." : "Generate Drafts (A / B / C)"}
        </button>
        <button onClick={handleLoadHistory} disabled={loadingHistory}>
          {loadingHistory ? "Loading..." : "View history"}
        </button>
        <a href={`/api/projects/${project.id}/export/txt`}>Export TXT</a>
        <a href={`/api/projects/${project.id}/export/json`}>Export JSON</a>
      </div>

      {saveError && <p role="alert" style={{ color: "var(--color-warning)" }}>{saveError}</p>}
      {compileError && <p role="alert" style={{ color: "var(--color-warning)" }}>{compileError}</p>}
      {analyzeError && <p role="alert" style={{ color: "var(--color-warning)" }}>{analyzeError}</p>}
      {interpretError && <p role="alert" style={{ color: "var(--color-warning)" }}>{interpretError}</p>}
      {draftError && <p role="alert" style={{ color: "var(--color-warning)" }}>{draftError}</p>}
      {historyError && <p role="alert" style={{ color: "var(--color-warning)" }}>{historyError}</p>}

      {interpretation && (
        <section>
          <h2>AI style suggestions</h2>
          <p style={{ fontSize: "0.85rem" }}>{interpretation.rationale}</p>
          {interpretation.fieldProvenance.length > 0 ? (
            <ul>
              {interpretation.fieldProvenance.map((entry) => (
                <li key={entry.fieldPath}>
                  <strong>AI suggested</strong> ({entry.origin.replace("inferred_", "")} confidence) —{" "}
                  {entry.fieldPath}
                  {entry.note ? `: ${entry.note}` : ""}
                </li>
              ))}
            </ul>
          ) : (
            <p>No confident suggestions this time — try adding more descriptive detail to your North Star.</p>
          )}
          {interpretation.fieldProvenance.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleApplyInterpretation}>Apply suggestions</button>
              <button onClick={handleDiscardInterpretation}>Discard</button>
            </div>
          )}
        </section>
      )}

      {drafts && (
        <section>
          <h2>Lyrics drafts</h2>
          {drafts.map((draft) => (
            <article key={draft.id} style={{ border: "1px solid currentColor", padding: "1rem", marginBottom: "1rem" }}>
              <h3>Draft {draft.label}</h3>
              <p style={{ whiteSpace: "pre-wrap" }}>{draft.lyrics}</p>
              <p style={{ fontSize: "0.85rem" }}>
                <strong>Techniques used:</strong> {draft.techniquesUsed.length > 0 ? draft.techniquesUsed.join(", ") : "none"}
                {" — "}
                {draft.notes}
              </p>
              <button onClick={() => setDiffTarget(draft)}>Use this draft</button>

              {diffTarget?.id === draft.id && (
                <div style={{ marginTop: "0.75rem", borderTop: "1px dashed currentColor", paddingTop: "0.75rem" }}>
                  <p>
                    <strong>Diff vs. current lyrics:</strong>
                  </p>
                  {diffLines(originalLyrics, draft.lyrics).map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color:
                          line.type === "added" ? "var(--color-success)" : line.type === "removed" ? "var(--color-warning)" : "inherit",
                      }}
                    >
                      {line.type === "added" ? "+ " : line.type === "removed" ? "- " : "  "}
                      {line.text}
                    </div>
                  ))}
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => handleApplyDraft(draft)}>Confirm & Save</button>
                    <button onClick={() => setDiffTarget(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      {theory && (
        <section>
          <h2>Theory check</h2>
          {theory.engineWarnings.length === 0 ? (
            <p>No open suggestions.</p>
          ) : (
            <ul>
              {theory.engineWarnings.map((w, i) => (
                <li key={`${w.engine}:${w.message}:${i}`} style={{ marginBottom: "0.5rem" }}>
                  <strong>
                    [{w.severity}] {w.engine}:
                  </strong>{" "}
                  {w.message}
                  {w.suggestion && (
                    <>
                      {" — "}
                      <em>{w.suggestion}</em>
                    </>
                  )}
                  <button onClick={() => handleDismiss(w.engine, w.message)} style={{ marginLeft: "0.5rem" }}>
                    Dismiss
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {results && (
        <section>
          <h2>Results</h2>
          {(["safe", "balanced", "bold"] as const).map((strategy) => {
            const pkg = results[strategy];
            return (
              <article key={strategy} style={{ border: "1px solid currentColor", padding: "1rem", marginBottom: "1rem" }}>
                <h3>{strategy}</h3>
                <p>
                  <strong>Style:</strong> {pkg.fields.style}
                </p>
                <p>
                  <strong>Lyrics:</strong> {pkg.fields.lyrics}
                </p>
                {pkg.unsupportedIntents.length > 0 && (
                  <p>
                    <strong>Unsupported:</strong>{" "}
                    {pkg.unsupportedIntents.map((i) => i.intent).join(", ")}
                  </p>
                )}
                <button onClick={() => copyToClipboard(strategy, pkg.copyBundle)}>
                  {copiedKey === strategy ? "Copied!" : "Copy"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {history && (
        <section>
          <h2>History</h2>
          {history.length === 0 ? (
            <p>No past compiles yet.</p>
          ) : (
            <ul>
              {history.map((entry) => (
                <li key={entry.id} style={{ marginBottom: "0.5rem" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>{" "}
                  — <strong>{entry.strategy}</strong> ({entry.providerId}, {entry.model})
                  <button onClick={() => setExpandedHistoryId((id) => (id === entry.id ? null : entry.id))} style={{ marginLeft: "0.5rem" }}>
                    {expandedHistoryId === entry.id ? "Hide" : "Show"}
                  </button>
                  {expandedHistoryId === entry.id && (
                    <div style={{ border: "1px solid currentColor", padding: "0.75rem", marginTop: "0.5rem" }}>
                      <p>
                        <strong>Style:</strong> {entry.style ?? "(none)"}
                      </p>
                      <p>
                        <strong>Lyrics:</strong> {entry.lyrics ?? "(none)"}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}

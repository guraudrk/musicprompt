"use client";

import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { SongDesignSpec } from "@/domain/songDesignSpec/schema";
import type { LyricsMode } from "@/domain/songDesignSpec/lyrics";
import type { MusicAIPromptPackage } from "@/domain/promptPackage/schema";
import type { CompositionTheorySpec } from "@/domain/songDesignSpec/theory";
import type { LyricsDraft } from "@/domain/lyrics/draft";
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

type CompareResult = { safe: MusicAIPromptPackage; balanced: MusicAIPromptPackage; bold: MusicAIPromptPackage };

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

  const [lyricsMode, setLyricsMode] = useState<LyricsMode>(spec.lyricsDesign.mode);
  const [originalLyrics, setOriginalLyrics] = useState(spec.lyricsDesign.originalLyrics ?? "");
  const [lockedLinesText, setLockedLinesText] = useState(spec.lyricsDesign.lockedLines.join("\n"));

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
      },
      lyricsDesign: {
        ...base.lyricsDesign,
        mode: lyricsMode,
        originalLyrics: originalLyrics || undefined,
        lockedLines: splitList(lockedLinesText),
      },
      exclusions: splitList(exclusionsText),
      providerSelection: { ...base.providerSelection, selectedProviderIds },
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
      setSaveError(body.error ?? "Save failed.");
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
        <button onClick={handleGenerateDrafts} disabled={drafting}>
          {drafting ? "Drafting..." : "Generate Drafts (A / B / C)"}
        </button>
        <a href={`/api/projects/${project.id}/export/txt`}>Export TXT</a>
        <a href={`/api/projects/${project.id}/export/json`}>Export JSON</a>
      </div>

      {saveError && <p role="alert" style={{ color: "var(--color-warning)" }}>{saveError}</p>}
      {compileError && <p role="alert" style={{ color: "var(--color-warning)" }}>{compileError}</p>}
      {analyzeError && <p role="alert" style={{ color: "var(--color-warning)" }}>{analyzeError}</p>}
      {draftError && <p role="alert" style={{ color: "var(--color-warning)" }}>{draftError}</p>}

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
    </main>
  );
}

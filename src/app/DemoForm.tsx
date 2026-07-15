"use client";

import { useState } from "react";
import Link from "next/link";
import type { MusicAIPromptPackage } from "@/domain/promptPackage/schema";
import { extractHints, type ExtractedHints } from "@/domain/songDesignSpec/extractHints";
import styles from "./Hero.module.css";
import { useDictionary } from "./LocaleProvider";

/**
 * No-login demo: calls the real-Gemini-backed /api/demo/compile endpoint (ADR-046), rate-limited
 * rather than structurally Mock-only. A single real compile takes ~15-40s+ (two sequential Gemini
 * calls, structured theory-grounded output) — far from instant, so this shows an on-device instant
 * guess (extractHints — the exact same deterministic function the server also uses) the moment
 * Generate is clicked, then swaps in the real result once it arrives, instead of a blank
 * "Generating..." wait. Signing up is still what unlocks saving a project and all three
 * Safe/Balanced/Bold variants — this is a taste, not a replacement.
 */
export function DemoForm() {
  const dict = useDictionary();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ExtractedHints | null>(null);
  const [result, setResult] = useState<MusicAIPromptPackage | null>(null);

  async function handleGenerate() {
    setError(null);
    setResult(null);
    setPreview(extractHints(idea));
    setLoading(true);

    const response = await fetch("/api/demo/compile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });

    setLoading(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: dict.demoForm.genericError }));
      setError(body.error ?? dict.demoForm.genericError);
      return;
    }
    const { package: pkg } = await response.json();
    setResult(pkg);
  }

  const hasPreview = !!preview && (preview.genres.length > 0 || !!preview.tempo || !!preview.vocal);
  const previewLine = hasPreview
    ? [preview!.genres.join(", "), preview!.tempo, preview!.vocal].filter(Boolean).join(" · ")
    : null;

  return (
    <div className={styles.demoForm}>
      <label className={styles.demoLabel} htmlFor="demo-idea">
        {dict.demoForm.label}
      </label>
      <textarea
        id="demo-idea"
        className={styles.demoTextarea}
        rows={3}
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder={dict.demoForm.placeholder}
      />
      <button className={styles.demoButton} onClick={handleGenerate} disabled={loading || idea.trim().length === 0}>
        {loading ? dict.demoForm.generating : dict.demoForm.generate}
      </button>

      {error && (
        <p role="alert" className={styles.demoError}>
          {error}
        </p>
      )}

      {!result && previewLine && (
        <div className={styles.demoResult}>
          <p>
            <span className={styles.demoPreviewBadge}>{dict.demoForm.previewBadge}</span> {previewLine}
          </p>
          {loading && <p className={styles.demoUpsell}>{dict.demoForm.upgradingNotice}</p>}
        </div>
      )}

      {result && (
        <div className={styles.demoResult}>
          <p>
            <strong>{dict.demoForm.style}</strong> {result.fields.style}
          </p>
          <p>
            <strong>{dict.demoForm.lyrics}</strong> {result.fields.lyrics ?? dict.demoForm.noLyricsFallback}
          </p>
          <p className={styles.demoUpsell}>
            <Link href="/signup">{dict.demoForm.signUpLink}</Link> {dict.demoForm.upsellSuffix}
          </p>
        </div>
      )}
    </div>
  );
}

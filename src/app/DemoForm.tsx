"use client";

import { useState } from "react";
import Link from "next/link";
import type { MusicAIPromptPackage } from "@/domain/promptPackage/schema";
import styles from "./Hero.module.css";
import { useDictionary } from "./LocaleProvider";

/**
 * No-login demo: calls the Mock-only /api/demo/compile endpoint (see that route's comment for why
 * it can never reach real Gemini). Signing up is still what unlocks real Gemini output, all three
 * Safe/Balanced/Bold variants, and saving a project — this is a taste, not a replacement.
 */
export function DemoForm() {
  const dict = useDictionary();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MusicAIPromptPackage | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

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

      {result && (
        <div className={styles.demoResult}>
          <p>
            <strong>{dict.demoForm.style}</strong> {result.fields.style}
          </p>
          <p>
            <strong>{dict.demoForm.lyrics}</strong> {result.fields.lyrics}
          </p>
          <p className={styles.demoUpsell}>
            <Link href="/signup">{dict.demoForm.signUpLink}</Link> {dict.demoForm.upsellSuffix}
          </p>
        </div>
      )}
    </div>
  );
}

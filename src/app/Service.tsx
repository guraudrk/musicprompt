"use client";

import type { CSSProperties } from "react";
import styles from "./Service.module.css";
import { Reveal } from "./Reveal";
import { useDictionary } from "./LocaleProvider";

const CARD_META = [
  { emoji: "🎛️", accent: "var(--color-accent-primary)" },
  { emoji: "📐", accent: "var(--color-accent-secondary)" },
  { emoji: "✍️", accent: "var(--color-lyrics)" },
] as const;

export function Service() {
  const dict = useDictionary();

  const cards = [
    { outcome: dict.service.card1Outcome, detail: dict.service.card1Detail, ...CARD_META[0] },
    { outcome: dict.service.card2Outcome, detail: dict.service.card2Detail, ...CARD_META[1] },
    { outcome: dict.service.card3Outcome, detail: dict.service.card3Detail, ...CARD_META[2] },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>{dict.service.heading}</h2>
        </Reveal>
        <div className={styles.grid}>
          {cards.map((card, i) => (
            <Reveal key={card.outcome} delayMs={i * 100}>
              <div className={styles.card} style={{ "--accent": card.accent } as CSSProperties}>
                <span className={styles.cardEmoji}>{card.emoji}</span>
                <p className={styles.cardOutcome}>{card.outcome}</p>
                <p className={styles.cardDetail}>{card.detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

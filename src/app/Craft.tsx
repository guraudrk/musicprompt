"use client";

import type { CSSProperties } from "react";
import styles from "./Craft.module.css";
import { Reveal } from "./Reveal";
import { useDictionary } from "./LocaleProvider";

const CARD_ACCENTS = [
  "var(--color-accent-gold)",
  "var(--color-accent-crimson)",
  "var(--color-accent-secondary)",
  "var(--color-accent-primary)",
] as const;

export function Craft() {
  const dict = useDictionary();

  const principles = [
    { title: dict.craft.card1Title, body: dict.craft.card1Body, accent: CARD_ACCENTS[0] },
    { title: dict.craft.card2Title, body: dict.craft.card2Body, accent: CARD_ACCENTS[1] },
    { title: dict.craft.card3Title, body: dict.craft.card3Body, accent: CARD_ACCENTS[2] },
    { title: dict.craft.card4Title, body: dict.craft.card4Body, accent: CARD_ACCENTS[3] },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>{dict.craft.heading}</h2>
          <p className={styles.subheading}>{dict.craft.subheading}</p>
        </Reveal>
        <div className={styles.grid}>
          {principles.map((p, i) => (
            <Reveal key={p.title} delayMs={i * 90}>
              <div className={styles.card} style={{ "--accent": p.accent } as CSSProperties}>
                <p className={styles.cardTitle}>{p.title}</p>
                <p className={styles.cardBody}>{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

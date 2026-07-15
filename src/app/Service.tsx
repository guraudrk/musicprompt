import type { CSSProperties } from "react";
import styles from "./Service.module.css";
import { Reveal } from "./Reveal";

const CARDS = [
  {
    emoji: "🎛️",
    accent: "var(--color-accent-primary)",
    outcome: "Compare three directions before you spend a generation",
    detail:
      "Every project compiles into Safe, Balanced, and Bold prompt packages in parallel — from the safest interpretation to the boldest creative swing — so the choice happens before you commit, not after.",
  },
  {
    emoji: "📐",
    accent: "var(--color-accent-secondary)",
    outcome: "Composition theory, checked automatically",
    detail:
      "Seven engines — form, melody, harmony, rhythm, prosody, arrangement, subtraction — check every project and surface warnings you can dismiss or lock in place, so issues surface before generation instead of after a wasted take.",
  },
  {
    emoji: "✍️",
    accent: "var(--color-lyrics)",
    outcome: "Three lyric drafts, your locked lines untouched",
    detail:
      "Generate A/B/C lyric drafts in direct, metaphorical, or hybrid style. Whatever techniques you selected are the only ones that appear, and any line you lock survives every draft, compile, and revision verbatim.",
  },
] as const;

export function Service() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>What actually happens between your idea and the prompt ⚡</h2>
        </Reveal>
        <div className={styles.grid}>
          {CARDS.map((card, i) => (
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

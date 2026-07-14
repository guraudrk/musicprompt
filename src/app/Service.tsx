import styles from "./Service.module.css";
import { Reveal } from "./Reveal";

const CARDS = [
  {
    outcome: "Compare three directions before you spend a generation",
    detail:
      "Every project compiles into Safe, Balanced, and Bold prompt packages in parallel — from the safest interpretation to the boldest creative swing — so the choice happens before you commit, not after.",
  },
  {
    outcome: "Composition theory, checked automatically",
    detail:
      "Seven engines — form, melody, harmony, rhythm, prosody, arrangement, subtraction — check every project and surface warnings you can dismiss or lock in place, so issues surface before generation instead of after a wasted take.",
  },
  {
    outcome: "Three lyric drafts, your locked lines untouched",
    detail:
      "Generate A/B/C lyric drafts in direct, metaphorical, or hybrid style. Whatever techniques you selected are the only ones that appear, and any line you lock survives every draft, compile, and revision verbatim.",
  },
] as const;

export function Service() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.inner}>
          <h2 className={styles.heading}>What actually happens between your idea and the prompt</h2>
          <div className={styles.grid}>
            {CARDS.map((card) => (
              <div key={card.outcome} className={styles.card}>
                <p className={styles.cardOutcome}>{card.outcome}</p>
                <p className={styles.cardDetail}>{card.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

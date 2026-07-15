import type { CSSProperties } from "react";
import styles from "./Craft.module.css";
import { Reveal } from "./Reveal";

const PRINCIPLES = [
  {
    accent: "var(--color-accent-gold)",
    title: "Reference is function, not surface",
    body: "Point at a song you admire and the spec captures why it works — restrained verse vs. expanded chorus, a delayed reveal, a silence before the hook — never its melody, lyrics, or voice. Naming a reference requires at least three deliberate differences before it compiles.",
  },
  {
    accent: "var(--color-accent-crimson)",
    title: "Direct and simple is a complete option",
    body: "Not every song needs a metaphor. Direct, plain-spoken lyrics are treated as a first-class choice, not a fallback for when something more elaborate doesn't work out.",
  },
  {
    accent: "var(--color-accent-secondary)",
    title: "What you lock, stays locked",
    body: "A favorite line, a fixed hook, a title you won't change — mark it locked and it survives every draft, every compile, every revision, character for character.",
  },
  {
    accent: "var(--color-accent-primary)",
    title: "We studied the syllabus, not just vibes 🎓",
    body: "The 7 theory engines above directly implement principles taught in Berklee, USC Thornton, NYU Steinhardt, and Juilliard songwriting curricula. The lyric technique menu is grounded in real K-pop lyricist practice — multi-draft comparison, demo-fitting, the working method associated with lyricists like Kim Eana. Not invented from scratch, and not claiming to guarantee a hit — just checked automatically instead of left to guesswork.",
  },
] as const;

export function Craft() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>Built on real songwriting craft 🎓✨</h2>
          <p className={styles.subheading}>
            Not marketing claims — rules enforced in the code every time a project compiles.
          </p>
        </Reveal>
        <div className={styles.grid}>
          {PRINCIPLES.map((p, i) => (
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

import styles from "./Craft.module.css";
import { Reveal } from "./Reveal";

const PRINCIPLES = [
  {
    title: "Reference is function, not surface",
    body: "Point at a song you admire and the spec captures why it works — restrained verse vs. expanded chorus, a delayed reveal, a silence before the hook — never its melody, lyrics, or voice. Naming a reference requires at least three deliberate differences before it compiles.",
  },
  {
    title: "Direct and simple is a complete option",
    body: "Not every song needs a metaphor. Direct, plain-spoken lyrics are treated as a first-class choice, not a fallback for when something more elaborate doesn't work out.",
  },
  {
    title: "What you lock, stays locked",
    body: "A favorite line, a fixed hook, a title you won't change — mark it locked and it survives every draft, every compile, every revision, character for character.",
  },
] as const;

export function Craft() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.inner}>
          <h2 className={styles.heading}>Built on real songwriting craft</h2>
          <p className={styles.subheading}>
            Not marketing claims — rules enforced in the code every time a project compiles.
          </p>
          <div className={styles.grid}>
            {PRINCIPLES.map((p) => (
              <div key={p.title} className={styles.card}>
                <p className={styles.cardTitle}>{p.title}</p>
                <p className={styles.cardBody}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

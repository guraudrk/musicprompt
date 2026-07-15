import styles from "./Problem.module.css";
import { Reveal } from "./Reveal";

export function Problem() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>
            Ask two AIs for the same song. <span className={styles.pop}>Get two different songs. 🎵</span>
          </h2>
        </Reveal>

        <div className={styles.grid}>
          <Reveal delayMs={80}>
            <div className={`${styles.column} ${styles.columnWithout}`}>
              <p className={styles.columnTitle}>Without a shared spec</p>
              <ul>
                <li>Suno and Udio expect the idea shaped differently — the same description tuned for one often confuses the other.</li>
                <li>A song prompt is dozens of interacting decisions (structure, hook placement, lyric technique, what to exclude) — get one wrong by hand and the whole take drifts.</li>
                <li>Ask for a revision, and the one line you actually liked quietly disappears.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={200}>
            <div className={`${styles.column} ${styles.columnWith}`}>
              <p className={styles.columnTitle}>With Music Prompt Architect</p>
              <ul>
                <li>One validated <code>SongDesignSpec</code> compiles into a prompt package matched to each provider&apos;s capabilities.</li>
                <li>Composition and lyric theory checks run before you spend a generation, catching what a manual prompt would miss.</li>
                <li>Lines you lock stay exactly as written through every compile and revision.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

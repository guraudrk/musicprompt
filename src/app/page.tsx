import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Music Prompt Architect</h1>
        <p className={styles.subtitle}>
          Turn one musical idea into a reusable song blueprint and translate it into the language
          of multiple music-generation AIs.
        </p>
        <p className={styles.status}>First slice: domain model + mock compiler pipeline. Full UI is Phase 2+.</p>
      </main>
    </div>
  );
}

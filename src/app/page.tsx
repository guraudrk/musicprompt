import Link from "next/link";
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
        <p className={styles.status}>Phase 2: auth, persistence, and the core project flow. Full visual design is later.</p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
          <Link href="/login">Log in</Link>
          <Link href="/signup">Sign up</Link>
        </div>
      </main>
    </div>
  );
}

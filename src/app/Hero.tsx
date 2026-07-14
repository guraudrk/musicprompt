import Link from "next/link";
import styles from "./Hero.module.css";
import { ScrollHint } from "./ScrollHint";
import { HeroBackground } from "./HeroBackground";

export function Hero() {
  return (
    <section className={styles.hero}>
      <HeroBackground />
      <div className={styles.heroContent}>
        <h1 className={styles.headline}>
          One idea.
          <br />
          Every music AI.
        </h1>
        <p className={styles.heroDescription}>
          Suno and Udio each want the idea described differently. Music Prompt Architect turns
          your one idea into a validated song blueprint, then compiles it into a matched prompt
          for both — and for whatever comes next.
        </p>
      </div>

      <div className={styles.ctaBar}>
        <div className={styles.ctaButtons}>
          <Link href="/signup" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
            Sign up
          </Link>
          <Link href="/login" className={`${styles.ctaBtn} ${styles.ctaSecondary}`}>
            Log in
          </Link>
        </div>
        <ScrollHint />
      </div>
    </section>
  );
}

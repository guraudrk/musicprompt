import Link from "next/link";
import styles from "./Hero.module.css";
import { ScrollHint } from "./ScrollHint";
import { HeroBackground } from "./HeroBackground";
import { DemoForm } from "./DemoForm";

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
          Suno and Udio each want the idea described differently. Type yours below and see a real
          compiled result right now — no signup needed.
        </p>

        <DemoForm />

        <div className={styles.authLinks}>
          <Link href="/signup">Sign up</Link>
          <span aria-hidden="true">·</span>
          <Link href="/login">Log in</Link>
        </div>

        <ScrollHint />
      </div>
    </section>
  );
}

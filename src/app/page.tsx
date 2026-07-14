import Link from "next/link";
import styles from "./page.module.css";
import { ScrollHint } from "./ScrollHint";
import { HeroBackground } from "./HeroBackground";
import { DemoForm } from "./DemoForm";

export default function Home() {
  return (
    <div className={styles.scrollContainer}>
      <section className={styles.hero}>
        <HeroBackground />
        <div className={styles.heroContent}>
          <h1 className={styles.headline}>
            One idea.
            <br />
            Every music AI.
          </h1>
          <p className={styles.heroDescription}>
            Music Prompt Architect turns a single musical idea into a validated song blueprint,
            then compiles it into prompt packages tailored for Suno, Udio, and more.
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

      <section className={styles.detailSection}>
        <div className={styles.sectionContents}>
          <div className={styles.mediaWrap}>
            <DemoForm />
          </div>

          <dl className={styles.detailList}>
            <dt>Safe / Balanced / Bold</dt>
            <dd>
              Every project compiles into three parallel prompt packages — from the safest
              interpretation to the boldest creative swing — so you can compare before you commit.
            </dd>
            <dt>Seven theory engines, built in</dt>
            <dd>
              Form, melody, harmony, rhythm, prosody, arrangement, and subtraction checks run on
              every project, surfacing composition-theory warnings you can dismiss or lock in place.
            </dd>
          </dl>
        </div>
      </section>
    </div>
  );
}

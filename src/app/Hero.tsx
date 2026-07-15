"use client";

import Link from "next/link";
import styles from "./Hero.module.css";
import { ScrollHint } from "./ScrollHint";
import { HeroBackground } from "./HeroBackground";
import { DemoForm } from "./DemoForm";
import { useDictionary } from "./LocaleProvider";

export function Hero() {
  const dict = useDictionary();

  return (
    <section className={styles.hero}>
      <HeroBackground />
      <div className={styles.heroContent}>
        <h1 className={styles.headline}>
          {dict.hero.headlineLine1}
          <br />
          {dict.hero.headlineLine2}
        </h1>
        <p className={styles.heroDescription}>{dict.hero.description}</p>

        <DemoForm />

        <div className={styles.authLinks}>
          <Link href="/signup">{dict.hero.signUp}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/login">{dict.hero.logIn}</Link>
        </div>

        <ScrollHint />
      </div>
    </section>
  );
}

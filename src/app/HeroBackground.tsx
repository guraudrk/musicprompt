"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

/**
 * Two genuinely public-domain Beethoven portraits (painters both died 100+ years ago), not
 * copyrighted photography of a living or recently-deceased artist. See DECISIONS.md for the
 * source/license verification. Self-hosted in public/images/hero/, not hotlinked.
 */
const PORTRAITS = [
  {
    src: "/images/hero/beethoven-stieler-1820.jpg",
    credit: "Joseph Karl Stieler, 1820 — public domain",
  },
  {
    src: "/images/hero/beethoven-mahler-1805.jpg",
    credit: "Joseph Willibrord Mähler, 1804–05 — public domain",
  },
];

const CROSSFADE_INTERVAL_MS = 8000;

export function HeroBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setIndex((i) => (i + 1) % PORTRAITS.length);
    }, CROSSFADE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.heroBackground} data-testid="hero-background" aria-hidden="true">
      {PORTRAITS.map((portrait, i) => (
        <div
          key={portrait.src}
          className={styles.heroImageLayer}
          data-active={i === index}
          data-testid="hero-image-layer"
        >
          <Image src={portrait.src} alt="" fill priority={i === 0} sizes="100vw" className={styles.heroImage} />
        </div>
      ))}
      <div className={styles.heroScrim} />
      <p className={styles.heroCredit}>{PORTRAITS[index].credit}</p>
    </div>
  );
}

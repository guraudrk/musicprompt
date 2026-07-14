"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

/**
 * Fades out once the user starts scrolling, matching a common teaser-page pattern of hinting at
 * more content below the fold and getting out of the way as soon as it's no longer needed.
 */
export function ScrollHint() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return <div className={styles.scrollHint} data-scrolled={scrolled} aria-hidden="true" />;
}

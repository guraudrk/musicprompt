"use client";

import styles from "./Problem.module.css";
import { Reveal } from "./Reveal";
import { useDictionary } from "./LocaleProvider";

export function Problem() {
  const dict = useDictionary();

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.heading}>
            {dict.problem.headingPlain} <span className={styles.pop}>{dict.problem.headingPop}</span>
          </h2>
        </Reveal>

        <div className={styles.grid}>
          <Reveal delayMs={80}>
            <div className={`${styles.column} ${styles.columnWithout}`}>
              <p className={styles.columnTitle}>{dict.problem.withoutTitle}</p>
              <ul>
                <li>{dict.problem.withoutItem1}</li>
                <li>{dict.problem.withoutItem2}</li>
                <li>{dict.problem.withoutItem3}</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delayMs={200}>
            <div className={`${styles.column} ${styles.columnWith}`}>
              <p className={styles.columnTitle}>{dict.problem.withTitle}</p>
              <ul>
                <li>
                  {dict.problem.withItem1Before}
                  <code>SongDesignSpec</code>
                  {dict.problem.withItem1After}
                </li>
                <li>{dict.problem.withItem2}</li>
                <li>{dict.problem.withItem3}</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

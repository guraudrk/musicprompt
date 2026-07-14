import styles from "./page.module.css";
import { Hero } from "./Hero";
import { Problem } from "./Problem";
import { Service } from "./Service";
import { Craft } from "./Craft";
import { CTA } from "./CTA";

export default function Home() {
  return (
    <div className={styles.scrollContainer}>
      <Hero />
      <Problem />
      <Service />
      <Craft />
      <CTA />
    </div>
  );
}

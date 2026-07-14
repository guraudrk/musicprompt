import styles from "./CTA.module.css";
import { Reveal } from "./Reveal";
import { DemoForm } from "./DemoForm";

export function CTA() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.inner}>
          <h2 className={styles.heading}>Try it right now — no signup</h2>
          <p className={styles.subheading}>
            Type an idea, generate a real compiled result, see exactly what the pipeline produces.
            Sign up only when you want to save it.
          </p>
          <DemoForm />
        </div>
      </Reveal>
    </section>
  );
}

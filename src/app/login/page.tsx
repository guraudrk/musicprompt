"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "../AuthForm.module.css";
import { HeroBackground } from "../HeroBackground";
import { useDictionary } from "../LocaleProvider";

export default function LoginPage() {
  const dict = useDictionary();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });

    setSubmitting(false);
    if (result?.error) {
      setError(dict.auth.login.invalidCredentials);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <HeroBackground />
      <div className={styles.card}>
        <h1 className={styles.heading}>{dict.auth.login.heading}</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            {dict.auth.login.email}
            <input
              className={styles.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            {dict.auth.login.password}
            <input
              className={styles.input}
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          <button type="submit" className={styles.submit} disabled={submitting}>
            {submitting ? dict.auth.login.submitting : dict.auth.login.submit}
          </button>
        </form>
        <p className={styles.switchLink}>
          {dict.auth.login.noAccount} <a href="/signup">{dict.auth.login.signUpLink}</a>
        </p>
      </div>
    </main>
  );
}

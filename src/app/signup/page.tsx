"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import styles from "../AuthForm.module.css";
import { HeroBackground } from "../HeroBackground";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Sign up failed." }));
      setError(body.error ?? "Sign up failed.");
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);

    if (result?.error) {
      setError("Account created, but automatic login failed. Please log in.");
      router.push("/login");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className={styles.page}>
      <HeroBackground />
      <div className={styles.card}>
        <h1 className={styles.heading}>Sign up</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Email
            <input
              className={styles.input}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Password (min 8 characters)
            <input
              className={styles.input}
              type="password"
              required
              minLength={8}
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
            {submitting ? "Signing up..." : "Sign up"}
          </button>
        </form>
        <p className={styles.switchLink}>
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}

"use client";

import styles from "./LanguageSwitcher.module.css";
import { useLocale } from "./LocaleProvider";
import type { Locale } from "@/i18n/locale";

const OPTIONS: { locale: Locale; label: string; name: string }[] = [
  { locale: "en", label: "E", name: "English" },
  { locale: "ko", label: "한", name: "한국어" },
  { locale: "ja", label: "日", name: "日本語" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.switcher} role="group" aria-label="Language">
      {OPTIONS.map((option) => (
        <button
          key={option.locale}
          type="button"
          className={`${styles.button} ${locale === option.locale ? styles.buttonActive : ""}`}
          onClick={() => setLocale(option.locale)}
          aria-pressed={locale === option.locale}
          aria-label={option.name}
          title={option.name}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

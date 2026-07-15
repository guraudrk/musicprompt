"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locale";
import { dictionaries, type Dictionary } from "@/i18n/dictionaries";

const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null);

/**
 * Cookie-persisted, client-side locale (not URL-based routing — no /ko/, /ja/ paths). Simpler
 * than adding an i18n routing library for a static-copy translation of the landing/auth pages;
 * see DECISIONS.md for the trade-off (URLs aren't per-language/shareable).
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useDictionary(): Dictionary {
  const { locale } = useLocale();
  return dictionaries[locale];
}

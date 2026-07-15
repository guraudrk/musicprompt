export type Locale = "en" | "ko" | "ja";

export const LOCALES: Locale[] = ["en", "ko", "ja"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

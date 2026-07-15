import { describe, expect, it } from "vitest";
import { dictionaries } from "@/i18n/dictionaries";
import { LOCALES } from "@/i18n/locale";

function collectKeyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    collectKeyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

function collectValues(obj: unknown): unknown[] {
  if (obj === null || typeof obj !== "object") return [obj];
  return Object.values(obj as Record<string, unknown>).flatMap((value) => collectValues(value));
}

describe("i18n dictionaries", () => {
  it("every locale has exactly the same set of keys as English", () => {
    const enKeys = collectKeyPaths(dictionaries.en).sort();

    for (const locale of LOCALES) {
      if (locale === "en") continue;
      const keys = collectKeyPaths(dictionaries[locale]).sort();
      expect(keys).toEqual(enKeys);
    }
  });

  it("no dictionary value is an empty string", () => {
    for (const locale of LOCALES) {
      for (const value of collectValues(dictionaries[locale])) {
        expect(typeof value).toBe("string");
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });
});

import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

const NAME_BY_CODE = new Map(
  FALLBACK_LANGUAGES.map((lang) => [lang.code, lang.name]),
);

const INTL_LANGUAGE_NAMES = new Intl.DisplayNames(["en"], {
  type: "language",
});

export function getLanguageDisplayName(code: string): string {
  const fromCatalog = NAME_BY_CODE.get(code);
  if (fromCatalog) return fromCatalog;

  try {
    const name = INTL_LANGUAGE_NAMES.of(code);
    if (name && !name.includes("UNKNOWN")) return name;
  } catch {
    // ignore invalid codes
  }

  return code;
}

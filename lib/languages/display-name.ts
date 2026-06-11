import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

export type LanguageLabelOption = { code: string; name: string };

const NAME_BY_CODE = new Map(
  FALLBACK_LANGUAGES.map((lang) => [lang.code, lang.name]),
);

const INTL_LANGUAGE_NAMES = new Intl.DisplayNames(["en"], {
  type: "language",
});

function findLanguageInCatalog(
  code: string,
  catalog: readonly LanguageLabelOption[],
): LanguageLabelOption | undefined {
  return (
    catalog.find((entry) => entry.code === code) ??
    catalog.find(
      (entry) => entry.code.toLowerCase() === code.toLowerCase(),
    )
  );
}

export function getLanguageDisplayName(code: string): string {
  const trimmed = code.trim();
  const fromCatalog =
    NAME_BY_CODE.get(trimmed) ?? NAME_BY_CODE.get(trimmed.toLowerCase());
  if (fromCatalog) return fromCatalog;

  try {
    const name = INTL_LANGUAGE_NAMES.of(trimmed);
    if (name && !name.includes("UNKNOWN")) return name;
  } catch {
    // ignore invalid codes
  }

  return trimmed;
}

/** Prefer the label from a loaded language list (e.g. /api/languages). */
export function resolveLanguageLabel(
  code: string,
  catalog?: readonly LanguageLabelOption[],
): string {
  const match = catalog?.length ? findLanguageInCatalog(code, catalog) : undefined;
  if (match?.name) return match.name;
  return getLanguageDisplayName(code);
}

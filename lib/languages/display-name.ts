import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";

export type LanguageLabelOption = { code: string; name: string };

const NAME_BY_CODE = new Map(
  FALLBACK_LANGUAGES.map((lang) => [lang.code, lang.name]),
);

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

/** True when the code is in our static fallback list (stable across Node/browser ICU). */
export function isFallbackLanguageCode(code: string): boolean {
  const trimmed = code.trim();
  return (
    NAME_BY_CODE.has(trimmed) || NAME_BY_CODE.has(trimmed.toLowerCase())
  );
}

export function getLanguageDisplayName(code: string): string {
  const trimmed = code.trim();
  const fromCatalog =
    NAME_BY_CODE.get(trimmed) ?? NAME_BY_CODE.get(trimmed.toLowerCase());
  if (fromCatalog) return fromCatalog;

  // Do not use Intl for unknown codes — Node and browsers ship different ICU
  // data and disagree on rarer tags (e.g. "btx"), which breaks hydration.
  return trimmed;
}

/** Prefer the label from a loaded language list (e.g. /api/languages). */
export function resolveLanguageLabel(
  code: string,
  catalog?: readonly LanguageLabelOption[],
): string {
  const match = catalog?.length ? findLanguageInCatalog(code, catalog) : undefined;
  // Ignore placeholders where the "name" is just the code (seeded before catalog load).
  if (
    match?.name &&
    match.name.toLowerCase() !== code.trim().toLowerCase()
  ) {
    return match.name;
  }
  return getLanguageDisplayName(code);
}

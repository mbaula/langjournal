import type { LanguageLabelOption } from "@/lib/languages/display-name";

/** Lowercase code → display name, built on the server for hydration-safe UI. */
export type LanguageLabelMap = Record<string, string>;

export function buildLanguageLabelMap(
  catalog: readonly LanguageLabelOption[],
): LanguageLabelMap {
  const map: LanguageLabelMap = {};
  for (const { code, name } of catalog) {
    const key = code.trim().toLowerCase();
    if (!key || !name.trim()) continue;
    // Skip placeholders that are just the code again.
    if (name.trim().toLowerCase() === key) continue;
    map[key] = name.trim();
  }
  return map;
}

export function labelFromLanguageMap(
  code: string,
  labelByCode: LanguageLabelMap | undefined,
): string {
  const trimmed = code.trim();
  if (!trimmed) return trimmed;
  return labelByCode?.[trimmed.toLowerCase()] ?? trimmed;
}

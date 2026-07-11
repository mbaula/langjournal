import type { EntryRow } from "@/components/journal/entry-list";
import type { UserLanguageEntry } from "@/lib/db/onboarding";
import {
  labelFromLanguageMap,
  type LanguageLabelMap,
} from "@/lib/languages/language-label-map";

export type PastEntryLanguageTab = {
  code: string;
  label: string;
  count: number;
};

export function normalizeLanguageCode(code: string): string {
  return code.trim().toLowerCase();
}

export function entryMatchesLanguageTab(
  entry: Pick<EntryRow, "targetLanguage">,
  tabCode: string,
): boolean {
  if (!entry.targetLanguage?.trim()) {
    return false;
  }
  return (
    normalizeLanguageCode(entry.targetLanguage) ===
    normalizeLanguageCode(tabCode)
  );
}

export function filterEntriesByLanguageTab(
  entries: EntryRow[],
  tabCode: string,
): EntryRow[] {
  return entries.filter((entry) => entryMatchesLanguageTab(entry, tabCode));
}

/**
 * Build past-entry language tabs. Labels come only from `labelByCode` (server
 * snapshot) so SSR and client hydration always match.
 */
export function buildPastEntryLanguageTabs(
  entries: readonly EntryRow[],
  learningLanguages: readonly UserLanguageEntry[],
  labelByCode?: LanguageLabelMap,
): PastEntryLanguageTab[] {
  const codes: string[] = [];
  const seen = new Set<string>();

  for (const language of learningLanguages) {
    const code = language.languageCode.trim();
    if (!code) continue;
    const key = normalizeLanguageCode(code);
    if (seen.has(key)) continue;
    seen.add(key);
    codes.push(code);
  }

  for (const entry of entries) {
    const code = entry.targetLanguage?.trim();
    if (!code) continue;
    const key = normalizeLanguageCode(code);
    if (seen.has(key)) continue;
    seen.add(key);
    codes.push(code);
  }

  return codes.map((code) => ({
    code,
    label: labelFromLanguageMap(code, labelByCode),
    count: filterEntriesByLanguageTab([...entries], code).length,
  }));
}

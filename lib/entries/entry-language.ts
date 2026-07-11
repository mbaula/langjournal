export type EntryLanguageFields = {
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
};

export type LanguagePair = {
  source: string;
  target: string;
};

/** Prefer languages stored on the entry; fall back to the live profile pair. */
export function resolveEntryLanguagePair(
  entry: EntryLanguageFields,
  profile: LanguagePair,
): LanguagePair {
  return {
    source: entry.sourceLanguage ?? profile.source,
    target: entry.targetLanguage ?? profile.target,
  };
}

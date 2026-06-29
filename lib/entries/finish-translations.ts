import type { InlineTranslation } from "@/lib/entries/translate";

function persistedTranslations(translations: InlineTranslation[]): InlineTranslation[] {
  return translations.filter((translation) => !translation.id.startsWith("opt-"));
}

/** Merge finish snapshot with DB translations so saved words are not lost. */
export function resolveFinishedEntryTranslations(
  entryTranslations: unknown,
  snapshotTranslations?: InlineTranslation[],
): InlineTranslation[] | undefined {
  if (snapshotTranslations === undefined) {
    return undefined;
  }

  const fromDb = Array.isArray(entryTranslations)
    ? persistedTranslations(entryTranslations as InlineTranslation[])
    : [];
  const fromSnapshot = persistedTranslations(snapshotTranslations);

  const merged = new Map<string, InlineTranslation>();
  for (const translation of fromDb) {
    merged.set(translation.id, translation);
  }
  for (const translation of fromSnapshot) {
    merged.set(translation.id, translation);
  }

  if (merged.size > 0) {
    return [...merged.values()];
  }

  if (snapshotTranslations.length === 0) {
    return [];
  }

  return fromDb;
}

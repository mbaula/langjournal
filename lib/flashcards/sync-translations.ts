import type { InlineTranslation } from "@/lib/entries/translate";

export function isPersistedJournalTranslation(
  translation: InlineTranslation,
): boolean {
  const id = translation.id?.trim();
  if (!id || id.startsWith("opt-")) {
    return false;
  }

  return (
    Boolean(translation.translatedText?.trim()) &&
    Boolean(translation.sourceText?.trim())
  );
}

/** Includes optimistic translations so Practice can show words before commit finishes. */
export function isDisplayableJournalTranslation(
  translation: InlineTranslation,
): boolean {
  return (
    Boolean(translation.id?.trim()) &&
    Boolean(translation.translatedText?.trim()) &&
    Boolean(translation.sourceText?.trim())
  );
}

export function collectPersistedTranslations(
  translations: unknown,
): InlineTranslation[] {
  return collectJournalTranslations(translations, isPersistedJournalTranslation);
}

export function collectDisplayableTranslations(
  translations: unknown,
): InlineTranslation[] {
  return collectJournalTranslations(translations, isDisplayableJournalTranslation);
}

function collectJournalTranslations(
  translations: unknown,
  predicate: (translation: InlineTranslation) => boolean,
): InlineTranslation[] {
  if (!Array.isArray(translations)) {
    return [];
  }

  const result: InlineTranslation[] = [];
  for (const item of translations) {
    if (!item || typeof item !== "object") continue;
    const translation = item as InlineTranslation;
    if (predicate(translation)) {
      result.push(translation);
    }
  }
  return result;
}

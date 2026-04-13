import { randomUUID } from "crypto";

import { translatePlainText } from "@/lib/translate/google";

export type InlineTranslation = {
  id: string;
  sourceText: string;
  translatedText: string;
};

/**
 * Translate a single text segment. If `sourceText` already exists in the
 * translations array the existing record is returned (no API call).
 */
export async function translateSingleText(
  text: string,
  existingTranslations: InlineTranslation[],
  sourceLanguage: string,
  targetLanguage: string,
): Promise<
  | {
      ok: true;
      translation: InlineTranslation;
      translations: InlineTranslation[];
      isNew: boolean;
    }
  | { ok: false; error: string }
> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Nothing to translate" };
  if (trimmed.length > 3000)
    return { ok: false, error: "Text too long (max 3 000 chars)" };

  const existing = existingTranslations.find((t) => t.sourceText === trimmed);
  if (existing) {
    return {
      ok: true,
      translation: existing,
      translations: existingTranslations,
      isNew: false,
    };
  }

  let translatedText: string;
  try {
    translatedText = await translatePlainText(
      trimmed,
      sourceLanguage,
      targetLanguage,
    );
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Translation failed",
    };
  }

  const record: InlineTranslation = {
    id: randomUUID(),
    sourceText: trimmed,
    translatedText,
  };

  return {
    ok: true,
    translation: record,
    translations: [...existingTranslations, record],
    isNew: true,
  };
}

export function removeTranslation(
  translations: InlineTranslation[],
  translationId: string,
): InlineTranslation[] {
  return translations.filter((t) => t.id !== translationId);
}

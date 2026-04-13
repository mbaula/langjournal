import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";
import { translatePlainText } from "@/lib/translate/google";
import { memoryCacheGet, memoryCacheSet } from "@/lib/translate/memory-cache";

export type InlineTranslation = {
  id: string;
  sourceText: string;
  translatedText: string;
};

export type ResolveTranslationResult =
  | {
      ok: true;
      sourceText: string;
      translatedText: string;
      fromExisting: InlineTranslation | null;
      fromServerMemory: boolean;
    }
  | { ok: false; error: string };

/**
 * Resolves translated text using entry dedupe, process memory LRU, then Google.
 * Does not write to the database.
 */
export async function resolveTranslationText(
  text: string,
  existingTranslations: InlineTranslation[],
  sourceLanguage: string,
  targetLanguage: string,
): Promise<ResolveTranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Nothing to translate" };
  if (trimmed.length > 3000)
    return { ok: false, error: "Text too long (max 3 000 chars)" };

  const norm = normalizeTranslationSource(trimmed);
  const fromExisting =
    existingTranslations.find(
      (t) => normalizeTranslationSource(t.sourceText) === norm,
    ) ?? null;

  if (fromExisting) {
    return {
      ok: true,
      sourceText: fromExisting.sourceText,
      translatedText: fromExisting.translatedText,
      fromExisting,
      fromServerMemory: false,
    };
  }

  const key = translationMemoryCacheKey(
    sourceLanguage,
    targetLanguage,
    trimmed,
  );
  const cached = memoryCacheGet(key);
  if (cached !== undefined) {
    return {
      ok: true,
      sourceText: trimmed,
      translatedText: cached,
      fromExisting: null,
      fromServerMemory: true,
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

  memoryCacheSet(key, translatedText);

  return {
    ok: true,
    sourceText: trimmed,
    translatedText,
    fromExisting: null,
    fromServerMemory: false,
  };
}

export function removeTranslation(
  translations: InlineTranslation[],
  translationId: string,
): InlineTranslation[] {
  return translations.filter((t) => t.id !== translationId);
}

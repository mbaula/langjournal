import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";
import { matchTranslationCapitalization } from "@/lib/text/translation-capitalization";
import { translatePlainText } from "@/lib/translate/google";
import { memoryCacheGet, memoryCacheSet } from "@/lib/translate/memory-cache";

export type RealtimeTranslationResult =
  | {
      ok: true;
      sourceText: string;
      translatedText: string;
      fromServerMemory: boolean;
    }
  | { ok: false; error: string };

/** Memory LRU + Google only — no entry or profile lookup. */
export async function resolveRealtimeTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<RealtimeTranslationResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Nothing to translate" };
  if (trimmed.length > 3000)
    return { ok: false, error: "Text too long (max 3 000 chars)" };

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
      translatedText: matchTranslationCapitalization(trimmed, cached),
      fromServerMemory: true,
    };
  }

  try {
    const translatedText = await translatePlainText(
      trimmed,
      sourceLanguage,
      targetLanguage,
    );
    memoryCacheSet(key, translatedText);
    return {
      ok: true,
      sourceText: trimmed,
      translatedText: matchTranslationCapitalization(trimmed, translatedText),
      fromServerMemory: false,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Translation failed",
    };
  }
}

/** True when client-provided text matches a recent server translation for this phrase. */
export function clientTranslationMatchesServerCache(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  translatedText: string,
): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const key = translationMemoryCacheKey(
    sourceLanguage,
    targetLanguage,
    trimmed,
  );
  const cached = memoryCacheGet(key);
  if (cached === undefined) return false;
  return (
    cached === translatedText ||
    matchTranslationCapitalization(trimmed, cached) === translatedText
  );
}

export { normalizeTranslationSource };

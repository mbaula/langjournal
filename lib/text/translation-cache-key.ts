/**
 * Normalizes source text so near-duplicate phrases share one cache entry.
 * Must stay identical on client and server.
 */
export function normalizeTranslationSource(s: string): string {
  let t = s.normalize("NFC").trim();
  t = t.replace(/\s+/g, " ");
  t = t.replace(/[\u2018\u2019]/g, "'");
  t = t.replace(/[\u201C\u201D]/g, '"');
  t = t.replace(/\u2026/g, "...");
  return t;
}

export function translationMemoryCacheKey(
  sourceLanguage: string,
  targetLanguage: string,
  text: string,
): string {
  return `${sourceLanguage.toLowerCase()}\u0000${targetLanguage.toLowerCase()}\u0000${normalizeTranslationSource(text)}`;
}

import type { TranslationSpan } from "@/lib/entries/translate";

/** Extract the journal line containing a translated span as the example sentence. */
export function extractExampleSentence(
  body: string | null | undefined,
  span?: TranslationSpan | null,
): string | null {
  if (!body?.trim()) return null;

  if (span) {
    let charIndex = 0;
    for (const line of body.split("\n")) {
      const lineStart = charIndex;
      const lineEnd = charIndex + line.length;
      if (span.start >= lineStart && span.start <= lineEnd) {
        const trimmed = line.trim();
        return trimmed.length > 0 ? trimmed : null;
      }
      charIndex = lineEnd + 1;
    }
  }

  const firstNonEmpty = body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstNonEmpty ?? null;
}

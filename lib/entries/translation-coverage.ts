import type { InlineTranslation, TranslationSpan } from "@/lib/entries/translate";

function parseInlineTranslations(translations: unknown): InlineTranslation[] {
  if (!Array.isArray(translations)) return [];

  return translations.filter((item): item is InlineTranslation => {
    if (!item || typeof item !== "object") return false;
    const record = item as InlineTranslation;
    return (
      typeof record.id === "string" &&
      typeof record.sourceText === "string" &&
      typeof record.translatedText === "string"
    );
  });
}

function mergeSpans(spans: TranslationSpan[]): TranslationSpan[] {
  if (spans.length === 0) return [];

  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const merged: TranslationSpan[] = [{ ...sorted[0]! }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

function collectValidSpans(
  body: string,
  translations: InlineTranslation[],
): TranslationSpan[] {
  const spans: TranslationSpan[] = [];

  for (const translation of translations) {
    for (const span of translation.spans ?? []) {
      if (span.start < 0 || span.end <= span.start || span.end > body.length) {
        continue;
      }
      if (body.slice(span.start, span.end) !== translation.translatedText) {
        continue;
      }
      spans.push(span);
    }
  }

  return mergeSpans(spans);
}

/** Share of entry body characters covered by validated translation spans (0–100). */
export function translationCoveragePercent(
  body: string | null | undefined,
  translations: unknown,
): number {
  const text = body ?? "";
  if (text.length === 0) return 0;

  const spans = collectValidSpans(text, parseInlineTranslations(translations));
  const covered = spans.reduce((sum, span) => sum + (span.end - span.start), 0);

  return Math.min(100, Math.round((covered / text.length) * 100));
}

import type { InlineTranslation, TranslationSpan } from "@/lib/entries/translate";

export function appendTranslationSpan(
  translation: InlineTranslation,
  span: TranslationSpan,
  body: string,
): InlineTranslation {
  const slice = body.slice(span.start, span.end);
  if (slice !== translation.translatedText) return translation;

  const spans = translation.spans ?? [];
  if (spans.some((s) => s.start === span.start && s.end === span.end)) {
    return translation;
  }

  return { ...translation, spans: [...spans, span] };
}

export function upsertTranslationSpanInList(
  translations: InlineTranslation[],
  translationId: string,
  span: TranslationSpan,
  body: string,
): InlineTranslation[] {
  return translations.map((t) =>
    t.id === translationId ? appendTranslationSpan(t, span, body) : t,
  );
}

export function adjustTranslationSpansForEdit(
  translations: InlineTranslation[],
  editStart: number,
  removedLength: number,
  insertedLength: number,
): InlineTranslation[] {
  const editEnd = editStart + removedLength;
  const delta = insertedLength - removedLength;

  return translations.map((t) => {
    if (!t.spans?.length) return t;

    const nextSpans = t.spans
      .map((span) => {
        if (span.end <= editStart) return span;
        if (span.start >= editEnd) {
          return { start: span.start + delta, end: span.end + delta };
        }
        return null;
      })
      .filter((span): span is TranslationSpan => span !== null);

    if (nextSpans.length === 0) {
      const { spans: _spans, ...rest } = t;
      return rest;
    }

    return { ...t, spans: nextSpans };
  });
}

export function pruneInvalidTranslationSpans(
  body: string,
  translations: InlineTranslation[],
): InlineTranslation[] {
  return translations.map((t) => {
    if (!t.spans?.length) return t;

    const spans = t.spans.filter(
      (span) => body.slice(span.start, span.end) === t.translatedText,
    );

    if (spans.length === 0) {
      const { spans: _spans, ...rest } = t;
      return rest;
    }

    return { ...t, spans };
  });
}

export function persistTranslationWithSpan(
  translations: InlineTranslation[],
  translation: InlineTranslation,
  span: TranslationSpan,
  body: string,
): InlineTranslation[] {
  const withSpan = appendTranslationSpan(translation, span, body);
  return [...translations.filter((t) => t.id !== translation.id), withSpan];
}

import type { InlineTranslation } from "@/lib/entries/translate";

type TextSegment = { text: string; translation?: InlineTranslation };

function nonEmptyLineFallback(line: string): TextSegment[] {
  return [{ text: line || "\u00A0" }];
}

/** Split one line using stored highlight spans only (not global substring search). */
export function segmentTranslatedLineBySpans(
  line: string,
  lineStart: number,
  translations: InlineTranslation[],
): TextSegment[] {
  if (!line) return nonEmptyLineFallback(line);

  type Hit = {
    localStart: number;
    localEnd: number;
    translation: InlineTranslation;
  };

  const hits: Hit[] = [];

  for (const translation of translations) {
    if (!translation.spans?.length) continue;
    for (const span of translation.spans) {
      const overlapStart = Math.max(span.start, lineStart);
      const overlapEnd = Math.min(span.end, lineStart + line.length);
      if (overlapStart >= overlapEnd) continue;
      hits.push({
        localStart: overlapStart - lineStart,
        localEnd: overlapEnd - lineStart,
        translation,
      });
    }
  }

  if (hits.length === 0) return [{ text: line }];

  hits.sort(
    (a, b) =>
      a.localStart - b.localStart ||
      a.localEnd - a.localStart - (b.localEnd - b.localStart),
  );

  const merged: Hit[] = [];
  for (const hit of hits) {
    if (
      merged.some(
        (existing) =>
          hit.localStart < existing.localEnd &&
          hit.localEnd > existing.localStart,
      )
    ) {
      continue;
    }
    merged.push(hit);
  }

  const segments: TextSegment[] = [];
  let pos = 0;
  for (const hit of merged) {
    if (hit.localStart > pos) {
      segments.push({ text: line.slice(pos, hit.localStart) });
    }
    segments.push({
      text: line.slice(hit.localStart, hit.localEnd),
      translation: hit.translation,
    });
    pos = hit.localEnd;
  }
  if (pos < line.length) {
    segments.push({ text: line.slice(pos) });
  }

  return segments.length > 0 ? segments : nonEmptyLineFallback(line);
}

/** @deprecated Legacy substring matching — prefer `segmentTranslatedLineBySpans`. */
export function segmentTranslatedLine(
  line: string,
  translations: InlineTranslation[],
): TextSegment[] {
  if (!translations.length || !line) return nonEmptyLineFallback(line);

  const sorted = [...translations].sort(
    (a, b) => b.translatedText.length - a.translatedText.length,
  );

  let segments: TextSegment[] = [{ text: line }];

  for (const t of sorted) {
    const next: TextSegment[] = [];
    for (const seg of segments) {
      if (seg.translation) {
        next.push(seg);
        continue;
      }
      const parts = seg.text.split(t.translatedText);
      for (let i = 0; i < parts.length; i++) {
        if (parts[i]) next.push({ text: parts[i] });
        if (i < parts.length - 1)
          next.push({ text: t.translatedText, translation: t });
      }
    }
    segments = next;
  }

  if (segments.length === 0) return nonEmptyLineFallback(line);
  return segments;
}

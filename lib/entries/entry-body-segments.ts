import type { InlineTranslation } from "@/lib/entries/translate";

/** Split one line of entry text into plain and translated spans (longest match first). */
export function segmentTranslatedLine(
  line: string,
  translations: InlineTranslation[],
): Array<{ text: string; translation?: InlineTranslation }> {
  if (!translations.length || !line) return [{ text: line || "\u00A0" }];

  const sorted = [...translations].sort(
    (a, b) => b.translatedText.length - a.translatedText.length,
  );

  type Seg = { text: string; translation?: InlineTranslation };
  let segments: Seg[] = [{ text: line }];

  for (const t of sorted) {
    const next: Seg[] = [];
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

  if (segments.length === 0) return [{ text: "\u00A0" }];
  return segments;
}

import type { ReactNode } from "react";

import { journalTranslationHighlightClassName } from "@/components/journal/field-styles";
import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";

type SlashRange = { start: number; end: number } | null;

function splitPlainWithSlash(
  segText: string,
  absBase: number,
  slash: SlashRange,
  keyCounter: { n: number },
): ReactNode[] {
  const out: ReactNode[] = [];
  if (!slash || segText.length === 0) {
    out.push(<span key={keyCounter.n++}>{segText}</span>);
    return out;
  }
  const a = absBase;
  const b = absBase + segText.length;
  const lo = Math.max(a, slash.start);
  const hi = Math.min(b, slash.end);
  if (lo >= hi) {
    out.push(<span key={keyCounter.n++}>{segText}</span>);
    return out;
  }
  const i = lo - absBase;
  const j = hi - absBase;
  if (i > 0) out.push(<span key={keyCounter.n++}>{segText.slice(0, i)}</span>);
  out.push(
    <mark key={keyCounter.n++} className={journalTranslationHighlightClassName}>
      {segText.slice(i, j)}
    </mark>,
  );
  if (j < segText.length)
    out.push(<span key={keyCounter.n++}>{segText.slice(j)}</span>);
  return out;
}

/** Mirror layer under the transparent textarea: blue for translations and `//` segments. */
export function JournalEditingBackdropContent({
  body,
  translations,
  slashHighlight,
}: {
  body: string;
  translations: InlineTranslation[];
  slashHighlight: SlashRange;
}) {
  const keyCounter = { n: 0 };
  const pieces: ReactNode[] = [];
  let lineStart = 0;

  while (lineStart <= body.length) {
    const nl = body.indexOf("\n", lineStart);
    const lineEnd = nl === -1 ? body.length : nl;
    const line = body.slice(lineStart, lineEnd);

    if (line.length > 0) {
      const segs = segmentTranslatedLine(line, translations);
      let col = 0;
      for (const seg of segs) {
        const absBase = lineStart + col;
        const segText = seg.text;
        col += segText.length;

        if (seg.translation) {
          pieces.push(
            <mark
              key={keyCounter.n++}
              className={journalTranslationHighlightClassName}
              title={seg.translation.sourceText}
            >
              {segText}
            </mark>,
          );
        } else {
          pieces.push(
            ...splitPlainWithSlash(
              segText,
              absBase,
              slashHighlight,
              keyCounter,
            ),
          );
        }
      }
    }

    if (nl === -1) break;
    pieces.push(<span key={keyCounter.n++}>{"\n"}</span>);
    lineStart = lineEnd + 1;
  }

  return <>{pieces}</>;
}

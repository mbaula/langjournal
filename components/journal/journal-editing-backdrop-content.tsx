import type { ReactNode, RefObject } from "react";
import { Loader2 } from "lucide-react";

import { journalEditorTranslationHighlightClassName } from "@/components/journal/field-styles";
import { segmentTranslatedLineBySpans } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";

type SlashRange = { start: number; end: number } | null;

export type TranslationLoadingState = {
  start: number;
  end: number;
  showSpinner: boolean;
};

function TranslationSpinner() {
  return (
    <span
      className="journal-translation-spinner ml-0.5 inline-flex translate-y-[0.06em] align-baseline"
      aria-hidden
    >
      <Loader2 className="size-3.5 animate-spin text-sidebar-primary" strokeWidth={1.5} />
    </span>
  );
}

function splitPlainWithSlash(
  segText: string,
  absBase: number,
  slash: SlashRange,
  translationLoading: TranslationLoadingState | null,
  slashTranslateHint: string | null,
  keyCounter: { n: number },
  hintAnchorRef?: RefObject<HTMLSpanElement | null>,
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

  const showSpinner =
    translationLoading?.showSpinner === true &&
    translationLoading.start === slash.start &&
    translationLoading.end === hi;

  const atHighlightEnd = hi === slash.end;

  if (atHighlightEnd && slashTranslateHint) {
    out.push(
      <span key={keyCounter.n++} ref={hintAnchorRef} className="inline">
        <mark className={journalEditorTranslationHighlightClassName}>
          {segText.slice(i, j)}
          {showSpinner ? <TranslationSpinner /> : null}
        </mark>
      </span>,
    );
  } else {
    out.push(
      <mark
        key={keyCounter.n++}
        className={journalEditorTranslationHighlightClassName}
      >
        {segText.slice(i, j)}
        {showSpinner ? <TranslationSpinner /> : null}
      </mark>,
    );
  }
  if (j < segText.length)
    out.push(<span key={keyCounter.n++}>{segText.slice(j)}</span>);
  return out;
}

/** Mirror layer under the transparent textarea: blue for translations and `//` segments. */
export function JournalEditingBackdropContent({
  body,
  translations,
  slashHighlight,
  translationLoading = null,
  slashTranslateHint = null,
  translatingLabel = "Translating…",
  hintAnchorRef,
}: {
  body: string;
  translations: InlineTranslation[];
  slashHighlight: SlashRange;
  translationLoading?: TranslationLoadingState | null;
  slashTranslateHint?: string | null;
  translatingLabel?: string;
  hintAnchorRef?: RefObject<HTMLSpanElement | null>;
}) {
  const keyCounter = { n: 0 };
  const pieces: ReactNode[] = [];
  let lineStart = 0;

  while (lineStart <= body.length) {
    const nl = body.indexOf("\n", lineStart);
    const lineEnd = nl === -1 ? body.length : nl;
    const line = body.slice(lineStart, lineEnd);

    if (line.length > 0) {
      const segs = segmentTranslatedLineBySpans(line, lineStart, translations);
      let col = 0;
      for (const seg of segs) {
        const absBase = lineStart + col;
        const segText = seg.text;
        col += segText.length;

        if (seg.translation) {
          pieces.push(
            <mark
              key={keyCounter.n++}
              className={journalEditorTranslationHighlightClassName}
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
              translationLoading,
              slashTranslateHint,
              keyCounter,
              hintAnchorRef,
            ),
          );
        }
      }
    }

    if (nl === -1) break;
    pieces.push(<span key={keyCounter.n++}>{"\n"}</span>);
    lineStart = lineEnd + 1;
  }

  return (
    <>
      {translationLoading?.showSpinner ? (
        <span className="sr-only">{translatingLabel}</span>
      ) : null}
      {pieces}
    </>
  );
}

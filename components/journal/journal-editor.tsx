"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { journalTextareaClassName } from "@/components/journal/field-styles";
import { countWords, wordCountLabel } from "@/lib/text/word-count";

const AUTOSAVE_MS = 900;

export type InlineTranslation = {
  id: string;
  sourceText: string;
  translatedText: string;
};

type JournalEditorProps = {
  entryId: string;
  initialBody: string;
  initialTranslations: InlineTranslation[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Find the **last** `//` on a line that is either at position 0 or preceded by
 * whitespace (avoids matching URLs like https://).
 * Only the last `//` is used so `//word1 blah //word2` translates just `word2`.
 */
function findSlashIndex(line: string): number {
  let result = -1;
  let from = 0;
  while (true) {
    const idx = line.indexOf("//", from);
    if (idx === -1) return result;
    if (idx === 0 || /\s/.test(line[idx - 1])) result = idx;
    from = idx + 1;
  }
}

/**
 * Split a line into segments, marking which segments correspond to known
 * translations so they can be highlighted.
 */
function segmentLine(
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JournalEditor({
  entryId,
  initialBody,
  initialTranslations,
}: JournalEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [translations, setTranslations] =
    useState<InlineTranslation[]>(initialTranslations);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [editing, setEditing] = useState(!initialBody);

  const bodyRef = useRef(body);
  bodyRef.current = body;
  const translationsRef = useRef(translations);
  translationsRef.current = translations;
  const savedBodyRef = useRef(initialBody);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const translatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  /* sync when entry changes */
  useEffect(() => {
    setBody(initialBody);
    savedBodyRef.current = initialBody;
  }, [entryId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTranslations(initialTranslations);
  }, [entryId, initialTranslations]);

  /* ---- cursor restore after programmatic body changes ---- */
  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && textareaRef.current) {
      textareaRef.current.selectionStart = pendingCursorRef.current;
      textareaRef.current.selectionEnd = pendingCursorRef.current;
      pendingCursorRef.current = null;
    }
  }, [body]);

  /* ---- save ---- */
  const saveBody = useCallback(
    async (text: string) => {
      if (text === savedBodyRef.current) return;
      savedBodyRef.current = text;
      await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
    },
    [entryId],
  );
  const saveBodyRef = useRef(saveBody);
  saveBodyRef.current = saveBody;

  useEffect(() => {
    if (!editing) return;
    const handle = window.setTimeout(() => {
      void saveBody(body);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [body, editing, saveBody]);

  useEffect(() => {
    return () => void saveBodyRef.current(bodyRef.current);
  }, []);

  /* ---- translate a single segment ---- */
  const translateText = useCallback(
    async (text: string): Promise<InlineTranslation | null> => {
      translatingRef.current = true;
      setTranslating(true);
      setError(null);
      try {
        const res = await fetch(`/api/entries/${entryId}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const data = (await res.json()) as {
          error?: string;
          translation?: InlineTranslation;
          translations?: InlineTranslation[];
        };
        if (!res.ok) {
          setError(data.error ?? "Translation failed");
          return null;
        }
        if (data.translations) setTranslations(data.translations);
        return data.translation ?? null;
      } catch {
        setError("Translation failed");
        return null;
      } finally {
        translatingRef.current = false;
        setTranslating(false);
      }
    },
    [entryId],
  );

  /* ---- delete translation ---- */
  const deleteTranslation = useCallback(
    async (translationId: string) => {
      setError(null);
      try {
        const res = await fetch(`/api/entries/${entryId}/translate`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translationId }),
        });
        const data = (await res.json()) as {
          error?: string;
          translations?: InlineTranslation[];
        };
        if (!res.ok) {
          setError(data.error ?? "Could not delete");
          return;
        }
        if (data.translations) setTranslations(data.translations);
      } catch {
        setError("Could not delete");
      }
    },
    [entryId],
  );

  /* ---- keyboard ---- */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      /* Ctrl+Enter → newline */
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const text = bodyRef.current;
        const next = text.slice(0, start) + "\n" + text.slice(end);
        pendingCursorRef.current = start + 1;
        setBody(next);
        return;
      }

      /* Enter → translate if // on current line */
      if (e.key === "Enter") {
        e.preventDefault();
        if (translating) return;

        const cursorPos = e.currentTarget.selectionStart;
        const text = bodyRef.current;

        const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;
        const lineEndIdx = text.indexOf("\n", lineStart);
        const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
        const currentLine = text.slice(lineStart, lineEnd);

        const slashIdx = findSlashIndex(currentLine);
        if (slashIdx === -1) return;

        const afterSlash = currentLine.slice(slashIdx + 2).trim();
        if (!afterSlash) return;

        void (async () => {
          const translation = await translateText(afterSlash);
          if (!translation) return;

          const cur = bodyRef.current;
          const absStart = lineStart + slashIdx;

          if (cur.slice(absStart, absStart + 2) !== "//") return;

          const before = cur.slice(0, absStart);
          const after = cur.slice(lineEnd);
          const newBody = before + translation.translatedText + after;

          pendingCursorRef.current =
            absStart + translation.translatedText.length;
          setBody(newBody);
          void saveBody(newBody);

          requestAnimationFrame(() => textareaRef.current?.focus());
        })();
      }
    },
    [translating, translateText, saveBody],
  );

  /* ---- blur → display mode ---- */
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (translatingRef.current) return;
      const container = containerRef.current;
      if (
        container &&
        e.relatedTarget instanceof Node &&
        container.contains(e.relatedTarget)
      )
        return;
      void saveBody(bodyRef.current);
      setEditing(false);
    },
    [saveBody],
  );

  /* ---- render ---- */
  const lines = body.split("\n");
  const wordCount = useMemo(() => countWords(body), [body]);

  if (editing) {
    return (
      <div
        ref={containerRef}
        className="flex w-full max-w-xl flex-col gap-3"
      >
        <div className="rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={handleBlur}
            readOnly={translating}
            rows={Math.max(12, lines.length + 2)}
            autoFocus
            placeholder="Start writing… type // before a word, then Enter to translate"
            className={journalTextareaClassName(
              "min-h-[30vh] resize-y border-0 bg-transparent shadow-none focus-visible:ring-offset-0",
              translating ? "opacity-60" : "",
            )}
          />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border border-border px-1 font-sans text-[0.7rem]">
                Enter
              </kbd>{" "}
              to translate{" "}
              <code className="rounded bg-muted px-1">{"//"}</code> text ·{" "}
              <kbd className="rounded border border-border px-1 font-sans text-[0.7rem]">
                Ctrl+Enter
              </kbd>{" "}
              new line
            </span>
            <span className="shrink-0 tabular-nums">
              {wordCountLabel(wordCount)}
            </span>
          </p>
        </div>
        {translating && (
          <p className="text-sm text-muted-foreground">Translating…</p>
        )}
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  /* ---- display mode ---- */
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div
        className="cursor-text rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm"
        onClick={() => setEditing(true)}
      >
        <div className="flex min-h-[30vh] flex-col gap-0 px-4 py-3">
          {lines.length === 0 || (lines.length === 1 && !lines[0]) ? (
            <p className="text-base leading-relaxed text-muted-foreground/60">
              Click to start writing…
            </p>
          ) : (
            lines.map((line, idx) => {
              const segs = segmentLine(line, translations);
              return (
                <p
                  key={idx}
                  className="min-h-7 whitespace-pre-wrap text-base leading-relaxed text-foreground"
                >
                  {segs.map((seg, si) =>
                    seg.translation ? (
                      <span key={si} className="group/tw relative inline">
                        <span
                          title={seg.translation.sourceText}
                          className="cursor-help rounded bg-muted/60 px-0.5"
                        >
                          {seg.text}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void deleteTranslation(seg.translation!.id);
                          }}
                          aria-label="Remove translation"
                          className="ml-0.5 hidden align-super text-[10px] leading-none text-muted-foreground hover:text-destructive group-hover/tw:inline"
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <span key={si}>{seg.text}</span>
                    ),
                  )}
                </p>
              );
            })
          )}
        </div>
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 text-xs text-muted-foreground">
          <span>Click to edit. Hover highlighted words to see the original.</span>
          <span className="shrink-0 tabular-nums">
            {wordCountLabel(wordCount)}
          </span>
        </p>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

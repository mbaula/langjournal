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
import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";

const AUTOSAVE_MS = 900;
const PREFETCH_DEBOUNCE_MS = 400;

export type InlineTranslation = {
  id: string;
  sourceText: string;
  translatedText: string;
};

type JournalEditorProps = {
  entryId: string;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  sourceLanguage: string;
  targetLanguage: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function parseCurrentSlashSegment(text: string, cursorPos: number) {
  const lineStart = text.lastIndexOf("\n", cursorPos - 1) + 1;
  const lineEndIdx = text.indexOf("\n", lineStart);
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
  const currentLine = text.slice(lineStart, lineEnd);

  const slashIdx = findSlashIndex(currentLine);
  if (slashIdx === -1) return null;

  const afterSlash = currentLine.slice(slashIdx + 2).trim();
  if (!afterSlash) return null;

  const absStart = lineStart + slashIdx;
  return { lineStart, lineEnd, slashIdx, absStart, afterSlash, currentLine };
}

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

/** Re-reads line bounds so paste + instant Enter still replaces the right span. */
function tryApplySlashTranslation(
  body: string,
  absStart: number,
  expectedNorm: string,
  translatedText: string,
): { next: string; cursor: number } | null {
  const lineEndIdx = body.indexOf("\n", absStart);
  const end = lineEndIdx === -1 ? body.length : lineEndIdx;
  const line = body.slice(absStart, end);
  const si = findSlashIndex(line);
  if (si === -1) return null;
  const rawAfter = line.slice(si + 2);
  if (normalizeTranslationSource(rawAfter.trim()) !== expectedNorm) return null;
  const chunkStart = absStart + si;
  return {
    next: body.slice(0, chunkStart) + translatedText + body.slice(end),
    cursor: chunkStart + translatedText.length,
  };
}

/** Removes abandoned inline pending tokens from older clients (never show UUIDs). */
function stripLegacyPendingMarkers(body: string): string {
  return body.replace(/⟦tr:[0-9a-f-]{36}⟧/gi, "");
}

function mergeTranslationState(
  prev: InlineTranslation[],
  t: InlineTranslation,
): InlineTranslation[] {
  if (prev.some((x) => x.id === t.id)) return prev;
  const filtered = prev.filter(
    (x) =>
      normalizeTranslationSource(x.sourceText) !==
      normalizeTranslationSource(t.sourceText),
  );
  return [...filtered, t];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JournalEditor({
  entryId,
  initialBody,
  initialTranslations,
  sourceLanguage,
  targetLanguage,
}: JournalEditorProps) {
  const [body, setBody] = useState(initialBody);
  const [translations, setTranslations] =
    useState<InlineTranslation[]>(initialTranslations);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!initialBody);

  const bodyRef = useRef(body);
  bodyRef.current = body;
  const translationsRef = useRef(translations);
  translationsRef.current = translations;
  const savedBodyRef = useRef(initialBody);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  const clientSessionCacheRef = useRef(
    new Map<string, { sourceText: string; translatedText: string }>(),
  );
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchDebounceTimerRef = useRef<number | null>(null);
  const prefetchInflightRef = useRef(
    new Map<string, Promise<{ sourceText: string; translatedText: string } | null>>(),
  );

  useEffect(() => {
    const cleaned = stripLegacyPendingMarkers(initialBody);
    setBody(cleaned);
    savedBodyRef.current = initialBody;
  }, [entryId, initialBody]);

  useEffect(() => {
    setTranslations(initialTranslations);
  }, [entryId, initialTranslations]);

  useEffect(() => {
    clientSessionCacheRef.current.clear();
    prefetchInflightRef.current.clear();
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    if (prefetchDebounceTimerRef.current !== null) {
      window.clearTimeout(prefetchDebounceTimerRef.current);
      prefetchDebounceTimerRef.current = null;
    }
  }, [entryId]);

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && textareaRef.current) {
      textareaRef.current.selectionStart = pendingCursorRef.current;
      textareaRef.current.selectionEnd = pendingCursorRef.current;
      pendingCursorRef.current = null;
    }
  }, [body]);

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

  useEffect(() => {
    return () => {
      if (prefetchDebounceTimerRef.current !== null) {
        window.clearTimeout(prefetchDebounceTimerRef.current);
      }
      prefetchAbortRef.current?.abort();
    };
  }, []);

  /** Server commit only — callers apply body then merge translations (avoids id/placeholder flashes). */
  const fetchCommitTranslation = useCallback(
    async (sourceSegment: string): Promise<InlineTranslation | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/entries/${entryId}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sourceSegment, intent: "commit" }),
        });
        const data = (await res.json()) as {
          error?: string;
          translation?: InlineTranslation;
        };
        if (!res.ok) {
          setError(data.error ?? "Translation failed");
          return null;
        }
        return data.translation ?? null;
      } catch {
        setError("Translation failed");
        return null;
      }
    },
    [entryId],
  );

  const schedulePrefetch = useCallback(() => {
    if (prefetchDebounceTimerRef.current !== null) {
      window.clearTimeout(prefetchDebounceTimerRef.current);
    }
    prefetchDebounceTimerRef.current = window.setTimeout(() => {
      prefetchDebounceTimerRef.current = null;
      const ta = textareaRef.current;
      if (!ta) return;
      const cursor = ta.selectionStart;
      const doc = bodyRef.current;
      const parsed = parseCurrentSlashSegment(doc, cursor);
      if (!parsed) return;

      const trimmed = parsed.afterSlash.trim();
      const key = translationMemoryCacheKey(
        sourceLanguage,
        targetLanguage,
        trimmed,
      );
      if (clientSessionCacheRef.current.has(key)) return;
      if (prefetchInflightRef.current.has(key)) return;

      prefetchAbortRef.current?.abort();
      const ac = new AbortController();
      prefetchAbortRef.current = ac;

      const prefetchCell: {
        p?: Promise<{ sourceText: string; translatedText: string } | null>;
      } = {};
      prefetchCell.p = (async (): Promise<{
        sourceText: string;
        translatedText: string;
      } | null> => {
        try {
          const res = await fetch(`/api/entries/${entryId}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: trimmed, intent: "prefetch" }),
            signal: ac.signal,
          });
          const data = (await res.json()) as {
            error?: string;
            sourceText?: string;
            translatedText?: string;
          };
          if (!res.ok) return null;
          if (
            typeof data.sourceText === "string" &&
            typeof data.translatedText === "string"
          ) {
            clientSessionCacheRef.current.set(key, {
              sourceText: data.sourceText,
              translatedText: data.translatedText,
            });
            return {
              sourceText: data.sourceText,
              translatedText: data.translatedText,
            };
          }
          return null;
        } catch {
          return null;
        } finally {
          if (prefetchInflightRef.current.get(key) === prefetchCell.p) {
            prefetchInflightRef.current.delete(key);
          }
          if (prefetchAbortRef.current === ac) {
            prefetchAbortRef.current = null;
          }
        }
      })();

      prefetchInflightRef.current.set(key, prefetchCell.p);
    }, PREFETCH_DEBOUNCE_MS);
  }, [entryId, sourceLanguage, targetLanguage]);

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

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

      if (e.key === "Enter") {
        e.preventDefault();
        const cursorPos = e.currentTarget.selectionStart;
        const text = bodyRef.current;
        const parsed = parseCurrentSlashSegment(text, cursorPos);
        if (!parsed) return;

        const { absStart, afterSlash } = parsed;
        const trimmed = afterSlash.trim();
        const key = translationMemoryCacheKey(
          sourceLanguage,
          targetLanguage,
          trimmed,
        );

        const norm = normalizeTranslationSource(trimmed);
        const fromState = translationsRef.current.find(
          (t) => normalizeTranslationSource(t.sourceText) === norm,
        );
        if (fromState) {
          const applied = tryApplySlashTranslation(
            text,
            absStart,
            norm,
            fromState.translatedText,
          );
          if (!applied) return;
          pendingCursorRef.current = applied.cursor;
          setBody(applied.next);
          void saveBody(applied.next);
          requestAnimationFrame(() => textareaRef.current?.focus());
          return;
        }

        void (async () => {
          const rollbackBody = text;

          const applyCommitted = (t: InlineTranslation) => {
            const cur = bodyRef.current;
            const applied = tryApplySlashTranslation(
              cur,
              absStart,
              norm,
              t.translatedText,
            );
            if (!applied) return;
            pendingCursorRef.current = applied.cursor;
            setBody(applied.next);
            setTranslations((prev) => mergeTranslationState(prev, t));
            void saveBody(applied.next);
            clientSessionCacheRef.current.set(key, {
              sourceText: t.sourceText,
              translatedText: t.translatedText,
            });
            requestAnimationFrame(() => textareaRef.current?.focus());
          };

          const cached = clientSessionCacheRef.current.get(key);
          if (cached) {
            const optimistic = tryApplySlashTranslation(
              text,
              absStart,
              norm,
              cached.translatedText,
            );
            if (!optimistic) return;
            pendingCursorRef.current = optimistic.cursor;
            setBody(optimistic.next);
            void saveBody(optimistic.next);

            const t = await fetchCommitTranslation(trimmed);
            if (!t) {
              setBody(rollbackBody);
              void saveBody(rollbackBody);
              return;
            }
            setTranslations((prev) => mergeTranslationState(prev, t));
            clientSessionCacheRef.current.set(key, {
              sourceText: t.sourceText,
              translatedText: t.translatedText,
            });
            if (t.translatedText !== cached.translatedText) {
              const fix = tryApplySlashTranslation(
                bodyRef.current,
                absStart,
                norm,
                t.translatedText,
              );
              if (fix) {
                pendingCursorRef.current = fix.cursor;
                setBody(fix.next);
                void saveBody(fix.next);
              }
            }
            requestAnimationFrame(() => textareaRef.current?.focus());
            return;
          }

          const inflight = prefetchInflightRef.current.get(key);
          if (inflight) {
            const pref = await inflight;
            if (!pref) return;
            const cur = bodyRef.current;
            if (cur.slice(absStart, absStart + 2) !== "//") return;
            const optimistic = tryApplySlashTranslation(
              cur,
              absStart,
              norm,
              pref.translatedText,
            );
            if (!optimistic) return;
            pendingCursorRef.current = optimistic.cursor;
            setBody(optimistic.next);
            void saveBody(optimistic.next);

            const t = await fetchCommitTranslation(trimmed);
            if (!t) {
              setBody(rollbackBody);
              void saveBody(rollbackBody);
              return;
            }
            setTranslations((prev) => mergeTranslationState(prev, t));
            clientSessionCacheRef.current.set(key, {
              sourceText: t.sourceText,
              translatedText: t.translatedText,
            });
            if (t.translatedText !== pref.translatedText) {
              const fix = tryApplySlashTranslation(
                bodyRef.current,
                absStart,
                norm,
                t.translatedText,
              );
              if (fix) {
                pendingCursorRef.current = fix.cursor;
                setBody(fix.next);
                void saveBody(fix.next);
              }
            }
            requestAnimationFrame(() => textareaRef.current?.focus());
            return;
          }

          if (text.slice(absStart, absStart + 2) !== "//") return;

          const t = await fetchCommitTranslation(trimmed);
          if (!t) return;
          applyCommitted(t);
        })();
      }
    },
    [fetchCommitTranslation, saveBody, sourceLanguage, targetLanguage],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
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

  const onBodyChange = useCallback(
    (next: string) => {
      setBody(next);
      schedulePrefetch();
    },
    [schedulePrefetch],
  );

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
            onChange={(e) => onBodyChange(e.target.value)}
            onSelect={schedulePrefetch}
            onKeyDown={onKeyDown}
            onBlur={handleBlur}
            rows={Math.max(12, lines.length + 2)}
            autoFocus
            placeholder="Start writing… type // before a word, pause briefly to prefetch, then Enter to apply"
            className={journalTextareaClassName(
              "min-h-[30vh] resize-y border-0 bg-transparent shadow-none focus-visible:ring-offset-0",
            )}
          />
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pb-2 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded border border-border px-1 font-sans text-[0.7rem]">
                Enter
              </kbd>{" "}
              applies translation (often already prefetched after a short pause
              on{" "}
              <code className="rounded bg-muted px-1">{"//"}</code>) ·{" "}
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
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

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

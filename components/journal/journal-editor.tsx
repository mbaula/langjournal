"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  journalTextareaClassName,
  journalTranslationHighlightClassName,
} from "@/components/journal/field-styles";
import { JournalEditingBackdropContent } from "@/components/journal/journal-editing-backdrop-content";
import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";
import { countWords, wordCountLabel } from "@/lib/text/word-count";
import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";
import { cn } from "@/lib/utils";

export type { InlineTranslation };

const AUTOSAVE_MS = 900;
const PREFETCH_DEBOUNCE_MS = 400;

export type TranslateTrigger = "enter" | "tab";

type JournalEditorProps = {
  entryId: string;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
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

/** Visual hint while editing: from `//` through line end when the caret touches that segment. */
function getSlashHighlightRange(
  text: string,
  selectionStart: number,
  selectionEnd: number,
): { start: number; end: number } | null {
  const anchor = Math.min(selectionStart, selectionEnd);
  const focus = Math.max(selectionStart, selectionEnd);
  const lineStart = text.lastIndexOf("\n", anchor - 1) + 1;
  const lineEndIdx = text.indexOf("\n", lineStart);
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
  const currentLine = text.slice(lineStart, lineEnd);
  const slashIdx = findSlashIndex(currentLine);
  if (slashIdx === -1) return null;
  const absStart = lineStart + slashIdx;
  if (focus < absStart) return null;
  return { start: absStart, end: lineEnd };
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
  translateTrigger = "enter",
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
  const [textareaSelection, setTextareaSelection] = useState({
    start: 0,
    end: 0,
  });
  const [textareaScrollTop, setTextareaScrollTop] = useState(0);

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
    const ta = textareaRef.current;
    if (!ta) return;
    if (pendingCursorRef.current !== null) {
      const p = pendingCursorRef.current;
      pendingCursorRef.current = null;
      ta.selectionStart = p;
      ta.selectionEnd = p;
    }
    setTextareaSelection({
      start: ta.selectionStart,
      end: ta.selectionEnd,
    });
  }, [body]);

  useEffect(() => {
    setTextareaScrollTop(0);
  }, [entryId]);

  const slashHighlight = useMemo(
    () =>
      getSlashHighlightRange(
        body,
        textareaSelection.start,
        textareaSelection.end,
      ),
    [body, textareaSelection.start, textareaSelection.end],
  );

  const editingBackdrop = useMemo(
    () => (
      <JournalEditingBackdropContent
        body={body}
        translations={translations}
        slashHighlight={slashHighlight}
      />
    ),
    [body, translations, slashHighlight],
  );

  const syncCaretFromTextarea = useCallback((ta: HTMLTextAreaElement) => {
    setTextareaSelection({
      start: ta.selectionStart,
      end: ta.selectionEnd,
    });
  }, []);

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
      const triggerKey = translateTrigger === "tab" ? "Tab" : "Enter";
      const isTriggerKey = e.key === triggerKey;

      // When using Enter trigger: Ctrl/Cmd+Enter inserts newline
      if (translateTrigger === "enter" && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const start = e.currentTarget.selectionStart;
        const end = e.currentTarget.selectionEnd;
        const text = bodyRef.current;
        const next = text.slice(0, start) + "\n" + text.slice(end);
        pendingCursorRef.current = start + 1;
        setBody(next);
        return;
      }

      // Check if we're in a translation segment
      const cursorPos = e.currentTarget.selectionStart;
      const text = bodyRef.current;
      const parsed = parseCurrentSlashSegment(text, cursorPos);

      // Tab trigger: only intercept Tab if we're in a // segment
      if (translateTrigger === "tab" && e.key === "Tab") {
        if (!parsed) return; // Let Tab behave normally (or do nothing)
        e.preventDefault();
      }

      // Enter trigger: always intercept Enter, but only translate if in // segment
      if (translateTrigger === "enter" && e.key === "Enter") {
        e.preventDefault();
        if (!parsed) return;
      }

      // If this isn't the trigger key, or we're not in a // segment, bail
      if (!isTriggerKey || !parsed) return;

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
    },
    [fetchCommitTranslation, saveBody, sourceLanguage, targetLanguage, translateTrigger],
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

  const lines = useMemo(() => body.split("\n"), [body]);
  const wordCount = useMemo(() => countWords(body), [body]);

  if (editing) {
    return (
      <div
        ref={containerRef}
        className="flex w-full max-w-none flex-col gap-3"
      >
        <div className="w-full">
          <div className="relative w-full">
            <div
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
              aria-hidden="true"
            >
              <pre
                className="font-sans m-0 min-h-full whitespace-pre-wrap break-words border-0 bg-transparent px-0 py-1 text-[15px] leading-[1.65] text-foreground antialiased"
                style={{
                  transform: `translateY(-${textareaScrollTop}px)`,
                }}
              >
                {editingBackdrop}
              </pre>
            </div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => {
                syncCaretFromTextarea(e.currentTarget);
                onBodyChange(e.target.value);
              }}
              onSelect={(e) => {
                syncCaretFromTextarea(e.currentTarget);
                schedulePrefetch();
              }}
              onKeyUp={(e) => syncCaretFromTextarea(e.currentTarget)}
              onClick={(e) => syncCaretFromTextarea(e.currentTarget)}
              onScroll={(e) =>
                setTextareaScrollTop(e.currentTarget.scrollTop)
              }
              onKeyDown={onKeyDown}
              onBlur={handleBlur}
              rows={Math.max(12, lines.length + 2)}
              autoFocus
              placeholder="Start writing…"
              className={journalTextareaClassName(
                "relative z-10 min-h-[30vh] resize-y break-words placeholder:text-muted-foreground/70 text-transparent",
              )}
            />
          </div>
          <p className="flex justify-end pb-1 text-[12px] text-muted-foreground tabular-nums">
            {wordCountLabel(wordCount)}
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
    <div className="flex w-full max-w-none flex-col gap-3">
      <div className="w-full cursor-text" onClick={() => setEditing(true)}>
        <div className="flex min-h-[30vh] flex-col gap-0 py-1">
          {lines.length === 0 || (lines.length === 1 && !lines[0]) ? (
            <p className="text-[15px] leading-[1.65] text-muted-foreground/70">
              Click to start writing…
            </p>
          ) : (
            lines.map((line, idx) => {
              const segs = segmentTranslatedLine(line, translations);
              return (
                <p
                  key={idx}
                  className="min-h-[1.65em] whitespace-pre-wrap text-[15px] leading-[1.65] text-foreground"
                >
                  {segs.map((seg, si) =>
                    seg.translation ? (
                      <span key={si} className="group/tw relative inline">
                        <span
                          title={seg.translation.sourceText}
                          className={cn(
                            "cursor-help",
                            journalTranslationHighlightClassName,
                          )}
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
        <p className="flex justify-end pb-1 text-[12px] text-muted-foreground tabular-nums">
          {wordCountLabel(wordCount)}
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

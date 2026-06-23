"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { journalEntryBodyClassName } from "@/components/journal/field-styles";
import { JournalEditingBackdropContent } from "@/components/journal/journal-editing-backdrop-content";
import type { TranslationLoadingState } from "@/components/journal/journal-editing-backdrop-content";
import type { InlineTranslation, TranslationSpan } from "@/lib/entries/translate";
import {
  adjustTranslationSpansForEdit,
  appendTranslationSpan,
  pruneInvalidTranslationSpans,
} from "@/lib/entries/translation-spans";
import { countWords, wordCountLabel } from "@/lib/text/word-count";
import {
  normalizeTranslationSource,
  translationMemoryCacheKey,
} from "@/lib/text/translation-cache-key";
import { matchTranslationCapitalization } from "@/lib/text/translation-capitalization";
import { cn } from "@/lib/utils";

export type { InlineTranslation };

const AUTOSAVE_MS = 900;
const PREFETCH_DEBOUNCE_MS = 150;
const PREFETCH_MIN_LENGTH = 2;
const TRANSLATION_SPINNER_DELAY_MS = 450;
const ENTRY_BODY_MIN_HEIGHT_CLASS = "min-h-[calc(100dvh-16rem)]";

type PrefetchResult = { sourceText: string; translatedText: string };

export type TranslateTrigger = "enter" | "tab";

type JournalEditorProps = {
  entryId: string;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
  onBodyChange?: (body: string) => void;
};

export type JournalEditorHandle = {
  flushSave: () => Promise<void>;
  getDraftContent: () => {
    body: string;
    translations: InlineTranslation[];
  };
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

  const absStart = lineStart + slashIdx;
  const cursorRel = Math.min(Math.max(cursorPos, lineStart), lineEnd) - lineStart;
  if (cursorRel < slashIdx + 2) return null;

  const rawSegment = currentLine.slice(slashIdx + 2, cursorRel);
  const afterSlash = rawSegment.trim();
  if (!afterSlash) return null;

  const absSegmentEnd = lineStart + cursorRel;
  return {
    lineStart,
    lineEnd,
    slashIdx,
    absStart,
    absSegmentEnd,
    afterSlash,
    rawSegment,
    currentLine,
  };
}

/** Visual hint while editing: from `//` through the typed segment (not the rest of the line). */
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
  const highlightEnd = Math.min(Math.max(focus, absStart + 2), lineEnd);
  return { start: absStart, end: highlightEnd };
}

/** Re-reads segment bounds so paste + instant Enter still replaces the right span. */
function tryApplySlashTranslation(
  body: string,
  absStart: number,
  absSegmentEnd: number,
  expectedNorm: string,
  translatedText: string,
): { next: string; cursor: number; appliedText: string } | null {
  if (absSegmentEnd <= absStart + 2) return null;
  const rawAfter = body.slice(absStart + 2, absSegmentEnd);
  if (normalizeTranslationSource(rawAfter.trim()) !== expectedNorm) return null;
  const appliedText = matchTranslationCapitalization(rawAfter, translatedText);
  return {
    next: body.slice(0, absStart) + appliedText + body.slice(absSegmentEnd),
    cursor: absStart + appliedText.length,
    appliedText,
  };
}

/** Removes abandoned inline pending tokens from older clients (never show UUIDs). */
function stripLegacyPendingMarkers(body: string): string {
  return body.replace(/⟦tr:[0-9a-f-]{36}⟧/gi, "");
}

function translationsForPersistence(
  translations: InlineTranslation[],
): InlineTranslation[] {
  return translations.filter((t) => !t.id.startsWith("opt-"));
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

export const JournalEditor = forwardRef<JournalEditorHandle, JournalEditorProps>(
  function JournalEditor(
    {
      entryId,
      initialBody,
      initialTranslations,
      sourceLanguage,
      targetLanguage,
      translateTrigger = "enter",
      onBodyChange,
    },
    ref,
  ) {
  const [body, setBody] = useState(initialBody);
  const [translations, setTranslations] =
    useState<InlineTranslation[]>(initialTranslations);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef(body);
  bodyRef.current = body;
  const translationsRef = useRef(translations);
  translationsRef.current = translations;
  const savedBodyRef = useRef(initialBody);
  const savedTranslationsRef = useRef(initialTranslations);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const [textareaSelection, setTextareaSelection] = useState({
    start: 0,
    end: 0,
  });

  const clientSessionCacheRef = useRef(
    new Map<string, { sourceText: string; translatedText: string }>(),
  );
  const prefetchAbortRef = useRef<AbortController | null>(null);
  const prefetchDebounceTimerRef = useRef<number | null>(null);
  const leadingPrefetchKeyRef = useRef<string | null>(null);
  const prefetchInflightRef = useRef(
    new Map<string, Promise<PrefetchResult | null>>(),
  );

  // Track language pair so we can clear caches when it changes
  const languagePairRef = useRef({ source: sourceLanguage, target: targetLanguage });
  useEffect(() => {
    const prev = languagePairRef.current;
    if (prev.source !== sourceLanguage || prev.target !== targetLanguage) {
      // Language changed — clear all translation caches to avoid stale results
      clientSessionCacheRef.current.clear();
      prefetchInflightRef.current.clear();
      leadingPrefetchKeyRef.current = null;
      languagePairRef.current = { source: sourceLanguage, target: targetLanguage };
    }
  }, [sourceLanguage, targetLanguage]);
  const translationLoadingTimerRef = useRef<number | null>(null);
  const [translationLoading, setTranslationLoading] =
    useState<TranslationLoadingState | null>(null);

  const clearTranslationLoading = useCallback(() => {
    if (translationLoadingTimerRef.current !== null) {
      window.clearTimeout(translationLoadingTimerRef.current);
      translationLoadingTimerRef.current = null;
    }
    setTranslationLoading(null);
  }, []);

  const beginTranslationLoading = useCallback(
    (range: { start: number; end: number }) => {
      if (translationLoadingTimerRef.current !== null) {
        window.clearTimeout(translationLoadingTimerRef.current);
      }
      setTranslationLoading({ ...range, showSpinner: false });
      translationLoadingTimerRef.current = window.setTimeout(() => {
        translationLoadingTimerRef.current = null;
        setTranslationLoading((prev) =>
          prev ? { ...prev, showSpinner: true } : null,
        );
      }, TRANSLATION_SPINNER_DELAY_MS);
    },
    [],
  );

  useEffect(() => {
    const cleaned = stripLegacyPendingMarkers(initialBody);
    setBody(cleaned);
    savedBodyRef.current = initialBody;
  }, [entryId, initialBody]);

  useEffect(() => {
    const cleaned = stripLegacyPendingMarkers(initialBody);
    setTranslations(pruneInvalidTranslationSpans(cleaned, initialTranslations));
    savedTranslationsRef.current = initialTranslations;
  }, [entryId, initialBody, initialTranslations]);

  useEffect(() => {
    clientSessionCacheRef.current.clear();
    prefetchInflightRef.current.clear();
    leadingPrefetchKeyRef.current = null;
    prefetchAbortRef.current?.abort();
    prefetchAbortRef.current = null;
    if (prefetchDebounceTimerRef.current !== null) {
      window.clearTimeout(prefetchDebounceTimerRef.current);
      prefetchDebounceTimerRef.current = null;
    }
    clearTranslationLoading();
  }, [entryId, clearTranslationLoading]);

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

  const syncTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    const shell = ta?.parentElement;
    if (!ta || !shell) return;
    ta.style.height = "0px";
    ta.style.height = `${Math.max(ta.scrollHeight, shell.clientHeight)}px`;
  }, []);

  useLayoutEffect(() => {
    syncTextareaHeight();
  }, [body, syncTextareaHeight]);

  const slashHighlight = useMemo(
    () =>
      getSlashHighlightRange(
        body,
        textareaSelection.start,
        textareaSelection.end,
      ),
    [body, textareaSelection.start, textareaSelection.end],
  );

  const slashTranslateHint = useMemo(() => {
    if (translationLoading?.showSpinner) return null;
    if (!slashHighlight) return null;
    if (textareaSelection.start < slashHighlight.start + 2) return null;
    return translateTrigger === "tab"
      ? "Press Tab to translate"
      : "Press Enter to translate";
  }, [
    slashHighlight,
    textareaSelection.start,
    translationLoading?.showSpinner,
    translateTrigger,
  ]);

  const editingBackdrop = useMemo(
    () => (
      <JournalEditingBackdropContent
        body={body}
        translations={translations}
        slashHighlight={slashHighlight}
        translationLoading={translationLoading}
        slashTranslateHint={slashTranslateHint}
      />
    ),
    [body, translations, slashHighlight, translationLoading, slashTranslateHint],
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
      const previous = savedBodyRef.current;
      savedBodyRef.current = text;
      try {
        const res = await fetch(`/api/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: text }),
        });
        if (!res.ok) savedBodyRef.current = previous;
      } catch {
        savedBodyRef.current = previous;
      }
    },
    [entryId],
  );
  const saveBodyRef = useRef(saveBody);
  saveBodyRef.current = saveBody;

  const saveTranslations = useCallback(
    async (next: InlineTranslation[]) => {
      const toPersist = translationsForPersistence(next);
      if (
        JSON.stringify(toPersist) ===
        JSON.stringify(savedTranslationsRef.current)
      ) {
        return;
      }
      const previous = savedTranslationsRef.current;
      savedTranslationsRef.current = toPersist;
      try {
        const res = await fetch(`/api/entries/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ translations: toPersist }),
        });
        if (!res.ok) savedTranslationsRef.current = previous;
      } catch {
        savedTranslationsRef.current = previous;
      }
    },
    [entryId],
  );
  const saveTranslationsRef = useRef(saveTranslations);
  saveTranslationsRef.current = saveTranslations;

  useImperativeHandle(
    ref,
    () => ({
      flushSave: async () => {
        await saveBodyRef.current(bodyRef.current);
        await saveTranslationsRef.current(translationsRef.current);
      },
      getDraftContent: () => ({
        body: bodyRef.current,
        translations: translationsRef.current,
      }),
    }),
    [],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void saveBody(body);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [body, saveBody]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void saveTranslations(translations);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [translations, saveTranslations]);

  useEffect(() => {
    return () => {
      void saveBodyRef.current(bodyRef.current);
      void saveTranslationsRef.current(translationsRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (prefetchDebounceTimerRef.current !== null) {
        window.clearTimeout(prefetchDebounceTimerRef.current);
      }
      prefetchAbortRef.current?.abort();
      clearTranslationLoading();
    };
  }, [clearTranslationLoading]);

  const cancelScheduledPrefetch = useCallback(() => {
    if (prefetchDebounceTimerRef.current !== null) {
      window.clearTimeout(prefetchDebounceTimerRef.current);
      prefetchDebounceTimerRef.current = null;
    }
  }, []);

  /** Server commit only — callers apply body first, then persist in the background. */
  const fetchCommitTranslation = useCallback(
    async (
      sourceSegment: string,
      bodySnapshot: string,
      highlightSpan: TranslationSpan,
      translatedText: string,
    ): Promise<InlineTranslation | null> => {
      setError(null);
      try {
        const res = await fetch(`/api/entries/${entryId}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sourceSegment,
            translatedText,
            body: bodySnapshot,
            highlightSpan,
          }),
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

  const startPrefetch = useCallback(
    (trimmed: string, signal?: AbortSignal): Promise<PrefetchResult | null> => {
      if (trimmed.length < PREFETCH_MIN_LENGTH) {
        return Promise.resolve(null);
      }

      const key = translationMemoryCacheKey(
        sourceLanguage,
        targetLanguage,
        trimmed,
      );

      const cached = clientSessionCacheRef.current.get(key);
      if (cached) return Promise.resolve(cached);

      const inflight = prefetchInflightRef.current.get(key);
      if (inflight) return inflight;

      const cell: { p?: Promise<PrefetchResult | null> } = {};
      cell.p = (async (): Promise<PrefetchResult | null> => {
        try {
          const res = await fetch("/api/translate/realtime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: trimmed,
              source: sourceLanguage,
              target: targetLanguage,
            }),
            signal,
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
            const row: PrefetchResult = {
              sourceText: data.sourceText,
              translatedText: data.translatedText,
            };
            clientSessionCacheRef.current.set(key, row);
            return row;
          }
          return null;
        } catch {
          return null;
        } finally {
          if (prefetchInflightRef.current.get(key) === cell.p) {
            prefetchInflightRef.current.delete(key);
          }
        }
      })();

      prefetchInflightRef.current.set(key, cell.p);
      return cell.p;
    },
    [sourceLanguage, targetLanguage],
  );

  const runPrefetchWithAbort = useCallback(
    (trimmed: string) => {
      if (trimmed.length < PREFETCH_MIN_LENGTH) return;
      prefetchAbortRef.current?.abort();
      const ac = new AbortController();
      prefetchAbortRef.current = ac;
      void startPrefetch(trimmed, ac.signal).finally(() => {
        if (prefetchAbortRef.current === ac) {
          prefetchAbortRef.current = null;
        }
      });
    },
    [startPrefetch],
  );

  const getOrStartTranslationForEnter = useCallback(
    async (trimmed: string, key: string): Promise<PrefetchResult | null> => {
      const cached = clientSessionCacheRef.current.get(key);
      if (cached) return cached;

      const inflight = prefetchInflightRef.current.get(key);
      if (inflight) return inflight;

      cancelScheduledPrefetch();
      prefetchAbortRef.current?.abort();
      const ac = new AbortController();
      prefetchAbortRef.current = ac;
      try {
        return await startPrefetch(trimmed, ac.signal);
      } finally {
        if (prefetchAbortRef.current === ac) {
          prefetchAbortRef.current = null;
        }
      }
    },
    [cancelScheduledPrefetch, startPrefetch],
  );

  const schedulePrefetch = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    const parsed = parseCurrentSlashSegment(
      bodyRef.current,
      ta.selectionStart,
    );
    if (!parsed) {
      cancelScheduledPrefetch();
      leadingPrefetchKeyRef.current = null;
      return;
    }

    const trimmed = parsed.afterSlash.trim();
    if (trimmed.length < PREFETCH_MIN_LENGTH) {
      cancelScheduledPrefetch();
      leadingPrefetchKeyRef.current = null;
      return;
    }

    const key = translationMemoryCacheKey(
      sourceLanguage,
      targetLanguage,
      trimmed,
    );

    if (
      !clientSessionCacheRef.current.has(key) &&
      !prefetchInflightRef.current.has(key) &&
      leadingPrefetchKeyRef.current !== key
    ) {
      leadingPrefetchKeyRef.current = key;
      runPrefetchWithAbort(trimmed);
    }

    cancelScheduledPrefetch();
    prefetchDebounceTimerRef.current = window.setTimeout(() => {
      prefetchDebounceTimerRef.current = null;
      const taNow = textareaRef.current;
      if (!taNow) return;
      const parsedNow = parseCurrentSlashSegment(
        bodyRef.current,
        taNow.selectionStart,
      );
      if (!parsedNow) return;

      const trimmedNow = parsedNow.afterSlash.trim();
      if (trimmedNow.length < PREFETCH_MIN_LENGTH) return;

      const keyNow = translationMemoryCacheKey(
        sourceLanguage,
        targetLanguage,
        trimmedNow,
      );
      if (
        clientSessionCacheRef.current.has(keyNow) ||
        prefetchInflightRef.current.has(keyNow)
      ) {
        return;
      }

      runPrefetchWithAbort(trimmedNow);
    }, PREFETCH_DEBOUNCE_MS);
  }, [
    cancelScheduledPrefetch,
    runPrefetchWithAbort,
    sourceLanguage,
    targetLanguage,
  ]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const triggerKey = translateTrigger === "tab" ? "Tab" : "Enter";
      const isTriggerKey = e.key === triggerKey;

      const cursorPos = e.currentTarget.selectionStart;
      const text = bodyRef.current;
      const parsed = parseCurrentSlashSegment(text, cursorPos);

      // Tab trigger: only intercept Tab if we're in a // segment
      if (translateTrigger === "tab" && e.key === "Tab") {
        if (!parsed) return;
        e.preventDefault();
      }

      // Enter trigger: only intercept Enter if we're in a // segment
      if (translateTrigger === "enter" && e.key === "Enter") {
        if (!parsed) return;
        e.preventDefault();
      }

      if (!isTriggerKey || !parsed) return;

      const { absStart, absSegmentEnd, afterSlash } = parsed;
      const trimmed = afterSlash.trim();
      const norm = normalizeTranslationSource(trimmed);

      // Check client session cache first (keyed by language pair + text)
      const cacheKey = translationMemoryCacheKey(
        sourceLanguage,
        targetLanguage,
        trimmed,
      );
      const cachedInSession = clientSessionCacheRef.current.get(cacheKey);
      if (cachedInSession) {
        const applied = tryApplySlashTranslation(
          text,
          absStart,
          absSegmentEnd,
          norm,
          cachedInSession.translatedText,
        );
        if (applied) {
          const { appliedText } = applied;
          const span = {
            start: absStart,
            end: absStart + appliedText.length,
          };
          pendingCursorRef.current = applied.cursor;
          setBody(applied.next);
          const optimistic: InlineTranslation = {
            id: `opt-${crypto.randomUUID()}`,
            sourceText: cachedInSession.sourceText,
            translatedText: appliedText,
            spans: [span],
          };
          setTranslations((prev) => mergeTranslationState(prev, optimistic));
          void saveBody(applied.next);
          void fetchCommitTranslation(
            trimmed,
            applied.next,
            span,
            appliedText,
          ).then((t) => {
            if (t) {
              setTranslations((prev) => mergeTranslationState(prev, t));
            }
          });
          requestAnimationFrame(() => textareaRef.current?.focus());
          return;
        }
      }

      if (trimmed.length < PREFETCH_MIN_LENGTH) return;

      void (async () => {
        const hadCache = clientSessionCacheRef.current.has(cacheKey);
        const hadInflight = prefetchInflightRef.current.has(cacheKey);
        if (!hadCache && !hadInflight) {
          beginTranslationLoading({ start: absStart, end: absSegmentEnd });
        }

        const fetched = await getOrStartTranslationForEnter(trimmed, cacheKey);
        clearTranslationLoading();

        if (!fetched) {
          setError("Translation failed");
          return;
        }

        const cur = bodyRef.current;
        if (cur.slice(absStart, absStart + 2) !== "//") return;

        const applied = tryApplySlashTranslation(
          cur,
          absStart,
          absSegmentEnd,
          norm,
          fetched.translatedText,
        );
        if (!applied) return;

        const { appliedText } = applied;
        const span = {
          start: absStart,
          end: absStart + appliedText.length,
        };
        const optimistic: InlineTranslation = {
          id: `opt-${crypto.randomUUID()}`,
          sourceText: fetched.sourceText,
          translatedText: appliedText,
          spans: [span],
        };

        pendingCursorRef.current = applied.cursor;
        setBody(applied.next);
        setTranslations((prev) =>
          mergeTranslationState(prev, optimistic),
        );
        void saveBody(applied.next);

        clientSessionCacheRef.current.set(cacheKey, {
          ...fetched,
          translatedText: appliedText,
        });

        void fetchCommitTranslation(
          trimmed,
          applied.next,
          span,
          appliedText,
        ).then((t) => {
          if (!t) return;
          setTranslations((prev) => mergeTranslationState(prev, t));
          clientSessionCacheRef.current.set(cacheKey, {
            sourceText: t.sourceText,
            translatedText: t.translatedText,
          });
          if (t.translatedText !== appliedText) {
            const fix = tryApplySlashTranslation(
              bodyRef.current,
              absStart,
              absSegmentEnd,
              norm,
              t.translatedText,
            );
            if (fix) {
              pendingCursorRef.current = fix.cursor;
              setBody(fix.next);
              void saveBody(fix.next);
            }
          }
        });

        requestAnimationFrame(() => textareaRef.current?.focus());
      })();
    },
    [
      beginTranslationLoading,
      clearTranslationLoading,
      fetchCommitTranslation,
      getOrStartTranslationForEnter,
      saveBody,
      sourceLanguage,
      targetLanguage,
      translateTrigger,
    ],
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
    },
    [saveBody],
  );

  const onBodyChangeHandler = useCallback(
    (next: string) => {
      setBody(next);
      onBodyChange?.(next);
      schedulePrefetch();
    },
    [onBodyChange, schedulePrefetch],
  );

  const wordCount = useMemo(() => countWords(body), [body]);

  return (
    <div
      ref={containerRef}
      className="flex w-full max-w-none flex-col gap-3"
    >
      <div className={cn("relative w-full flex-1", ENTRY_BODY_MIN_HEIGHT_CLASS)}>
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-visible"
          aria-hidden="true"
        >
          <pre className="font-sans m-0 min-h-full overflow-visible whitespace-pre-wrap break-words border-0 bg-transparent px-0 py-1 text-[15px] leading-[1.65] text-foreground antialiased">
            {editingBackdrop}
          </pre>
        </div>
        <textarea
          ref={textareaRef}
          value={body}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          onChange={(e) => {
            const editStart = Math.min(
              textareaSelection.start,
              textareaSelection.end,
            );
            const editEnd = Math.max(
              textareaSelection.start,
              textareaSelection.end,
            );
            const oldBody = bodyRef.current;
            const next = e.target.value;
            const removedLength = editEnd - editStart;
            const insertedLength = next.length - oldBody.length + removedLength;
            if (removedLength !== 0 || next.length !== oldBody.length) {
              setTranslations((prev) =>
                adjustTranslationSpansForEdit(
                  prev,
                  editStart,
                  removedLength,
                  insertedLength,
                ),
              );
            }
            syncCaretFromTextarea(e.currentTarget);
            onBodyChangeHandler(next);
          }}
          onSelect={(e) => {
            syncCaretFromTextarea(e.currentTarget);
            schedulePrefetch();
          }}
          onKeyUp={(e) => syncCaretFromTextarea(e.currentTarget)}
          onClick={(e) => syncCaretFromTextarea(e.currentTarget)}
          onKeyDown={onKeyDown}
          onBlur={handleBlur}
          autoFocus
          placeholder="If you're stuck, use // to translate, let's write something..."
          className={journalEntryBodyClassName(
            "relative z-10 text-transparent",
            ENTRY_BODY_MIN_HEIGHT_CLASS,
          )}
        />
      </div>
      {slashTranslateHint ? (
        <p className="sr-only" aria-live="polite">
          {slashTranslateHint}
        </p>
      ) : null}
      <p className="flex justify-end pb-1 text-[12px] text-muted-foreground tabular-nums">
        {wordCountLabel(wordCount)}
      </p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
},
);

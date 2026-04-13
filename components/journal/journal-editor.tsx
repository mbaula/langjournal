"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { journalTextareaClassName } from "@/components/journal/field-styles";

const AUTOSAVE_MS = 900;
const DOUBLE_SLASH_RE = /^\/\/\s?/;

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

  useEffect(() => {
    setBody(initialBody);
    savedBodyRef.current = initialBody;
  }, [entryId]);

  useEffect(() => {
    setTranslations(initialTranslations);
  }, [entryId, initialTranslations]);

  // --- save ---
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

  // autosave while editing
  useEffect(() => {
    if (!editing) return;
    const handle = window.setTimeout(() => {
      void saveBody(body);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [body, editing, saveBody]);

  // flush on unmount
  useEffect(() => {
    return () => {
      void saveBodyRef.current(bodyRef.current);
    };
  }, []);

  // --- check for untranslated // lines client-side ---
  const hasNewSlashLines = useCallback(() => {
    const existing = new Set(translationsRef.current.map((t) => t.sourceText));
    for (const line of bodyRef.current.replace(/\r\n/g, "\n").split("\n")) {
      if (!DOUBLE_SLASH_RE.test(line)) continue;
      const raw = line.replace(DOUBLE_SLASH_RE, "").trim();
      if (raw && !existing.has(raw)) return true;
    }
    return false;
  }, []);

  // --- translate + render ---
  const submitAndRender = useCallback(async () => {
    const text = bodyRef.current;

    if (!hasNewSlashLines()) {
      void saveBody(text);
      setEditing(false);
      return;
    }

    setTranslating(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as {
        error?: string;
        translations?: InlineTranslation[];
      };
      if (!res.ok) {
        setError(data.error ?? "Translation failed");
        return;
      }
      if (data.translations) setTranslations(data.translations);
      setEditing(false);
    } catch {
      setError("Translation failed");
    } finally {
      setTranslating(false);
    }
  }, [entryId, hasNewSlashLines, saveBody]);

  // --- delete translation ---
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

  // --- keyboard ---
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        void submitAndRender();
      }
    },
    [submitAndRender],
  );

  // --- build lookup ---
  const translationMap = new Map<string, InlineTranslation>();
  for (const t of translations) {
    translationMap.set(t.sourceText, t);
  }

  const lines = body.split("\n");

  // --- render ---
  if (editing) {
    return (
      <div className="flex w-full max-w-xl flex-col gap-3">
        <div className="rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-sm">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
            rows={Math.max(12, lines.length + 2)}
            disabled={translating}
            autoFocus
            placeholder="Start writing… type // before text, then Ctrl+Enter"
            className={journalTextareaClassName(
              "min-h-[30vh] resize-y border-0 bg-transparent shadow-none focus-visible:ring-offset-0 disabled:opacity-60",
            )}
          />
          <p className="px-4 pb-2 text-xs text-muted-foreground">
            <kbd className="rounded border border-border px-1 font-sans text-[0.7rem]">
              Ctrl+Enter
            </kbd>{" "}
            to save &amp; translate{" "}
            <code className="rounded bg-muted px-1">//</code> lines.
          </p>
        </div>
        {translating ? (
          <p className="text-sm text-muted-foreground">Translating…</p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
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
              if (DOUBLE_SLASH_RE.test(line)) {
                const raw = line.replace(DOUBLE_SLASH_RE, "").trim();
                const t = raw ? translationMap.get(raw) : null;

                if (t) {
                  return (
                    <div
                      key={`t-${idx}-${t.id}`}
                      className="group/tline -mx-1 flex items-start gap-1 rounded-lg border-l-2 border-primary/60 bg-muted/40 px-3 py-1"
                    >
                      <p
                        title={raw}
                        className="flex-1 cursor-help whitespace-pre-wrap text-base leading-relaxed text-foreground"
                      >
                        {t.translatedText}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void deleteTranslation(t.id);
                        }}
                        aria-label="Remove translation"
                        className="mt-0.5 hidden shrink-0 rounded px-1.5 text-xs text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground group-hover/tline:inline-block"
                      >
                        &times;
                      </button>
                    </div>
                  );
                }

                return (
                  <p
                    key={`slash-${idx}`}
                    className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground italic"
                  >
                    {line}
                  </p>
                );
              }

              return (
                <p
                  key={`line-${idx}`}
                  className="min-h-7 whitespace-pre-wrap text-base leading-relaxed text-foreground"
                >
                  {line || "\u00A0"}
                </p>
              );
            })
          )}
        </div>
        <p className="px-4 pb-2 text-xs text-muted-foreground">
          Click to edit. Hover translations to see original or delete.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

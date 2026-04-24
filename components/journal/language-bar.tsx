"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";

import type { TranslateTrigger } from "@/components/journal/journal-editor";

type Lang = { code: string; name: string };

type LanguageBarProps = {
  source: string;
  target: string;
  translateTrigger?: TranslateTrigger;
};

const selectClass =
  "mt-1 w-full rounded-lg border border-border/80 bg-background px-2 py-1.5 text-xs text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

export function LanguageBar({
  source: initialSource,
  target: initialTarget,
  translateTrigger = "enter",
}: LanguageBarProps) {
  const triggerKeyLabel = translateTrigger === "tab" ? "Tab" : "Enter";
  const [source, setSource] = useState(initialSource);
  const [target, setTarget] = useState(initialTarget);

  useEffect(() => {
    setSource(initialSource);
    setTarget(initialTarget);
  }, [initialSource, initialTarget]);

  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [draftSource, setDraftSource] = useState(initialSource);
  const [draftTarget, setDraftTarget] = useState(initialTarget);

  useEffect(() => {
    if (open) {
      setDraftSource(source);
      setDraftTarget(target);
    }
  }, [open, source, target]);

  const [languages, setLanguages] = useState<Lang[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftSourceRef = useRef(draftSource);
  const draftTargetRef = useRef(draftTarget);
  draftSourceRef.current = draftSource;
  draftTargetRef.current = draftTarget;

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open && !helpOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setHelpOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, helpOpen]);

  const loadLanguages = useCallback(() => {
    setLoadingList(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/languages");
        const data = (await res.json()) as {
          error?: string;
          languages?: Lang[];
        };
        if (!res.ok) {
          setError(data.error ?? "Could not load languages");
          return;
        }
        if (data.languages?.length) {
          setLanguages(
            mergeProfileCodes(
              data.languages,
              draftSourceRef.current,
              draftTargetRef.current,
            ),
          );
        }
      } catch {
        setError("Could not load languages");
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    if (languages?.length) return;
    loadLanguages();
  }, [open, languages, loadLanguages]);

  const options = useMemo(
    () => mergeProfileCodes(languages ?? [], draftSource, draftTarget),
    [languages, draftSource, draftTarget],
  );

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/settings/language-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeLanguage: draftSource,
          targetLanguage: draftTarget,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        nativeLanguage?: string;
        targetLanguage?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.nativeLanguage) setSource(data.nativeLanguage);
      if (data.targetLanguage) setTarget(data.targetLanguage);
      setOpen(false);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [draftSource, draftTarget]);

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2"
      ref={rootRef}
    >
      <div className="relative">
        <div className="inline-flex items-center overflow-hidden rounded-md border border-border bg-muted/80 font-sans text-[13px] shadow-none">
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              setHelpOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-foreground transition-colors hover:bg-muted"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Change translation languages"
          >
            <span>
              {source.toUpperCase()} → {target.toUpperCase()}
            </span>
            <ChevronDown
              className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {open ? (
          <div
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,18rem)] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg"
            role="dialog"
            aria-label="Language pair"
          >
            <div className="flex flex-col gap-3">
              <div>
                <Label htmlFor="bar-native" className="text-xs">
                  Native
                </Label>
                <select
                  id="bar-native"
                  className={selectClass}
                  disabled={loadingList}
                  value={draftSource}
                  onChange={(e) => setDraftSource(e.target.value)}
                >
                  {options.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bar-target" className="text-xs">
                  Learning
                </Label>
                <select
                  id="bar-target"
                  className={selectClass}
                  disabled={loadingList}
                  value={draftTarget}
                  onChange={(e) => setDraftTarget(e.target.value)}
                >
                  {options.map((l) => (
                    <option key={`t-${l.code}`} value={l.code}>
                      {l.name} ({l.code})
                    </option>
                  ))}
                </select>
              </div>
              {error ? (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8"
                  disabled={saving || loadingList}
                  onClick={() => void save()}
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setHelpOpen((h) => !h);
            setOpen(false);
          }}
          className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/80 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-expanded={helpOpen}
          aria-haspopup="dialog"
          aria-label="How translation works"
        >
          <CircleHelp className="size-4" strokeWidth={1.75} />
        </button>

        {helpOpen ? (
          <div
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,22.5rem)] rounded-lg border border-border bg-popover p-4 text-[13px] text-popover-foreground leading-relaxed shadow-lg"
            role="dialog"
            aria-label="Translation help"
          >
            <p className="font-medium text-foreground">How inline translation works</p>
            <p className="mt-2 text-muted-foreground">
              You mark the <strong className="text-foreground">exact phrase</strong> to
              translate with <code className="rounded bg-muted px-1 text-[0.75rem] text-foreground">{"//"}</code>.
              Pressing{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-sans text-[0.7rem] text-foreground">
                {triggerKeyLabel}
              </kbd>{" "}
              runs translation on the text <strong className="text-foreground">after</strong>{" "}
              <code className="rounded bg-muted px-1 text-[0.75rem] text-foreground">{"//"}</code>{" "}
              on the <strong className="text-foreground">current line only</strong> (up to
              the line end). The{" "}
              <code className="rounded bg-muted px-1 text-[0.75rem] text-foreground">{"//"}</code>{" "}
              and that phrase are replaced by the translation.
            </p>

            <p className="mt-3 text-xs font-semibold tracking-wide text-foreground uppercase">
              Example
            </p>
            <div className="mt-2 space-y-2 rounded-md border border-border bg-muted/50 p-3 font-mono text-[12px] text-foreground leading-snug">
              <div>
                <span className="text-muted-foreground">You type:</span>
                <pre className="mt-1 whitespace-pre-wrap break-words">
                  I practiced saying //good morning
                </pre>
              </div>
              <div>
                <span className="text-muted-foreground">
                  You press{" "}
                  <kbd className="rounded border border-border bg-background px-1">
                    {triggerKeyLabel}
                  </kbd>
                  :
                </span>
                <pre className="mt-1 whitespace-pre-wrap break-words">
                  I practiced saying bonjour
                </pre>
                <p className="mt-1.5 font-sans text-[11px] text-muted-foreground normal-case">
                  (Here <code className="rounded bg-background px-0.5">bonjour</code> stands
                  in for whatever your app translates{" "}
                  <code className="rounded bg-background px-0.5">good morning</code> into
                  for your language pair.)
                </p>
              </div>
            </div>

            <p className="mt-3 text-muted-foreground">
              Need a normal new line without translating? Use{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-sans text-[0.7rem] text-foreground">
                Ctrl+Enter
              </kbd>{" "}
              or{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-sans text-[0.7rem] text-foreground">
                ⌘ Enter
              </kbd>
              .
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

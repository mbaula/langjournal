"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";

type Lang = { code: string; name: string };

type LanguageBarProps = {
  source: string;
  target: string;
};

const selectClass =
  "mt-1 w-full rounded-lg border border-border/80 bg-background px-2 py-1.5 text-xs text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

export function LanguageBar({ source: initialSource, target: initialTarget }: LanguageBarProps) {
  const [source, setSource] = useState(initialSource);
  const [target, setTarget] = useState(initialTarget);

  useEffect(() => {
    setSource(initialSource);
    setTarget(initialTarget);
  }, [initialSource, initialTarget]);

  const [open, setOpen] = useState(false);
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
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

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
    <div className="relative inline-flex" ref={rootRef}>
      <div className="inline-flex items-center overflow-hidden rounded-full border border-border/80 bg-background/90 font-sans text-sm shadow-sm backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2 font-medium text-foreground transition-colors hover:bg-muted/50"
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label="Change translation languages"
        >
          <span>
            {source.toUpperCase()} → {target.toUpperCase()}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <span className="self-stretch w-px bg-border/80" aria-hidden />
        <Link
          href="/app/settings"
          className="flex size-10 shrink-0 items-center justify-center bg-foreground text-background transition-colors hover:bg-foreground/85"
          aria-label="All settings"
        >
          <Settings className="size-4" />
        </Link>
      </div>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,18rem)] rounded-xl border border-border/80 bg-background p-3 shadow-lg"
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
  );
}

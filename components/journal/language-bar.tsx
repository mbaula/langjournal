"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";

import { SlashTranslateDemo } from "@/components/marketing/slash-translate-demo";
import { Button } from "@/components/ui/button";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import { resolveLanguageLabel } from "@/lib/languages/display-name";
import { cn } from "@/lib/utils";

import type { TranslateTrigger } from "@/components/journal/journal-editor";

const PANEL_ANIM_MS = 220;
const SAVE_SUCCESS_MS = 450;

type Lang = { code: string; name: string };

type LanguageBarProps = {
  source: string;
  target: string;
  translateTrigger?: TranslateTrigger;
  /** Called after a successful save so parents (e.g. the editor) can use the new pair. */
  onLanguagesSaved?: (source: string, target: string) => void;
};

const popoverPanelClass =
  "absolute right-0 top-[calc(100%+0.5rem)] z-50 rounded-3xl border border-border bg-popover text-popover-foreground shadow-lg";

const barControlHeightClass = "h-10";

const barControlSurfaceClass =
  "rounded-full border border-border bg-muted/80 shadow-none";

const selectClass =
  "mt-2 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

function LanguagePicker({
  id,
  subtitle,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  subtitle: string;
  value: string;
  options: Lang[];
  disabled: boolean;
  onChange: (code: string) => void;
}) {
  return (
    <section
      className="min-w-0 flex-1 rounded-md border border-border bg-muted/50 px-3 py-3"
      aria-labelledby={`${id}-subtitle`}
    >
      <p
        id={`${id}-subtitle`}
        className="text-xs font-medium text-muted-foreground"
      >
        {subtitle}
      </p>
      <select
        id={id}
        className={selectClass}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-labelledby={`${id}-subtitle`}
      >
        {options.map((l) => (
          <option key={`${id}-${l.code}`} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </section>
  );
}

export function LanguageBar({
  source: initialSource,
  target: initialTarget,
  translateTrigger = "enter",
  onLanguagesSaved,
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
  const [savedPulse, setSavedPulse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);

  const sourceRef = useRef(source);
  const targetRef = useRef(target);
  sourceRef.current = source;
  targetRef.current = target;

  const rootRef = useRef<HTMLDivElement>(null);
  const panelWasOpenRef = useRef(false);
  const panelCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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

  useEffect(() => {
    if (open) {
      if (panelCloseTimeoutRef.current) {
        clearTimeout(panelCloseTimeoutRef.current);
        panelCloseTimeoutRef.current = null;
      }

      panelWasOpenRef.current = true;
      setPanelClosing(false);
      if (!panelMounted) setPanelMounted(true);

      const frame = requestAnimationFrame(() => setPanelEntered(true));
      return () => cancelAnimationFrame(frame);
    }

    if (!panelWasOpenRef.current) return undefined;

    panelWasOpenRef.current = false;
    setPanelEntered(false);
    setPanelClosing(true);

    panelCloseTimeoutRef.current = setTimeout(() => {
      panelCloseTimeoutRef.current = null;
      setPanelMounted(false);
      setPanelClosing(false);
    }, PANEL_ANIM_MS);

    return () => {
      if (panelCloseTimeoutRef.current) {
        clearTimeout(panelCloseTimeoutRef.current);
        panelCloseTimeoutRef.current = null;
      }
    };
  }, [open, panelMounted]);

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
              sourceRef.current,
              targetRef.current,
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
    if (languages?.length) return;
    loadLanguages();
  }, [languages, loadLanguages]);

  const displayCatalog = useMemo(
    () => mergeProfileCodes(languages ?? [], source, target),
    [languages, source, target],
  );

  const sourceLabel = resolveLanguageLabel(source, displayCatalog);
  const targetLabel = resolveLanguageLabel(target, displayCatalog);

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
      const nextSource = data.nativeLanguage ?? draftSource;
      const nextTarget = data.targetLanguage ?? draftTarget;
      setSource(nextSource);
      setTarget(nextTarget);
      onLanguagesSaved?.(nextSource, nextTarget);
      setSavedPulse(true);
      await new Promise((resolve) => window.setTimeout(resolve, SAVE_SUCCESS_MS));
      setSavedPulse(false);
      setOpen(false);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [draftSource, draftTarget, onLanguagesSaved]);

  const pickerDisabled = loadingList || saving;
  const hasChanges = draftSource !== source || draftTarget !== target;

  return (
    <div
      className="inline-flex max-w-full shrink-0 flex-nowrap items-center gap-2"
      ref={rootRef}
    >
      <div className="relative min-w-0 shrink">
        <div
          className={cn(
            "inline-flex min-w-0 max-w-full items-center overflow-hidden font-sans text-[13px]",
            barControlSurfaceClass,
          )}
        >
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              setHelpOpen(false);
            }}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-full px-4 font-medium whitespace-nowrap text-foreground transition-colors hover:bg-muted sm:px-3.5",
              barControlHeightClass,
            )}
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label="Change translation languages"
          >
            <span className="truncate">
              {sourceLabel} → {targetLabel}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
                open && "rotate-180",
              )}
            />
          </button>
        </div>

        {panelMounted ? (
          <div
            className={cn(
              popoverPanelClass,
              "w-[min(100vw-2rem,28rem)] origin-top-right p-4 text-[13px] leading-relaxed transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
              panelEntered && !panelClosing
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-1 scale-[0.98] opacity-0",
              panelClosing && "pointer-events-none",
            )}
            role="dialog"
            aria-labelledby="language-pair-title"
            aria-describedby="language-pair-instructions"
          >
            <header className="border-b border-border pb-4">
              <p
                id="language-pair-title"
                className="text-base font-medium text-foreground"
              >
                Select your languages
              </p>
              <p
                id="language-pair-instructions"
                className="mt-2 text-muted-foreground"
              >
                Pick the language you write in and the one you&apos;re learning.
                Save when you&apos;re done.
              </p>
            </header>

            <div className="flex flex-col gap-2.5 pt-4 sm:flex-row">
              <LanguagePicker
                id="bar-native"
                subtitle="I'm writing in…"
                value={draftSource}
                options={options}
                disabled={pickerDisabled}
                onChange={setDraftSource}
              />
              <LanguagePicker
                id="bar-target"
                subtitle="I'm learning…"
                value={draftTarget}
                options={options}
                disabled={pickerDisabled}
                onChange={setDraftTarget}
              />
            </div>

            {error ? (
              <p className="mt-3 text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out",
                hasChanges ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
              )}
              aria-hidden={!hasChanges}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cn(
                    "flex justify-end gap-2 border-t border-border pt-3 transition-[transform,opacity] duration-200 ease-out",
                    hasChanges
                      ? "translate-y-0 opacity-100"
                      : "translate-y-1 opacity-0",
                  )}
                >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 transition-opacity duration-150"
                  disabled={saving || savedPulse}
                  onClick={() => {
                    setDraftSource(source);
                    setDraftTarget(target);
                    setError(null);
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-8 min-w-[4.5rem] transition-all duration-200 ease-out",
                    savedPulse && "scale-[0.98] opacity-90",
                  )}
                  disabled={pickerDisabled || savedPulse}
                  onClick={() => void save()}
                >
                  {saving ? "Saving…" : savedPulse ? "Saved!" : "Save"}
                </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setHelpOpen((h) => !h);
            setOpen(false);
          }}
          className="flex shrink-0 items-center justify-center p-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-expanded={helpOpen}
          aria-haspopup="dialog"
          aria-label="How to translate"
        >
          <CircleHelp className="size-5" strokeWidth={1.5} />
        </button>

        {helpOpen ? (
          <div
            className={`${popoverPanelClass} w-[min(100vw-2rem,26rem)] p-4 text-[13px] leading-relaxed`}
            role="dialog"
            aria-label="Translation help"
          >
            <p className="font-medium text-foreground">How to translate</p>
            <p className="mt-2 text-muted-foreground">
              Type{" "}
              <code className="rounded bg-muted px-1 text-[0.75rem] text-foreground">{"//"}</code>{" "}
              followed by the word or phrase you want, then press{" "}
              <kbd className="rounded border border-border bg-muted px-1 font-sans text-[0.7rem] text-foreground">
                {triggerKeyLabel}
              </kbd>
              .
            </p>

            <div className="mt-4">
              <SlashTranslateDemo
                variant="compact"
                translateTriggerKey={triggerKeyLabel}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleHelp, Globe, Search, X } from "lucide-react";

import { SlashTranslateDemo } from "@/components/marketing/slash-translate-demo";
import { Button } from "@/components/ui/button";
import {
  formatLanguageCodeBadge,
  languageBarIconButtonClassName,
  languageBarLabelClassName,
  languageBarTriggerClassName,
} from "@/components/journal/language-bar-trigger-display";
import {
  LanguageBarFloatingPanel,
  computeHelpPopoverRect,
  computeLanguagePickerRect,
} from "@/components/journal/language-bar-floating-panel";
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

const languageBarPopoverBaseClass =
  "rounded-3xl border border-border bg-popover p-5 text-sm leading-relaxed text-popover-foreground shadow-lg sm:p-6";

const languageBarPopoverTitleClassName =
  "text-base font-semibold tracking-tight text-foreground";

const languageBarPopoverDescriptionClassName =
  "mt-1 text-sm leading-relaxed text-foreground/80";

const languageBarPopoverHeaderClassName = "pb-4";

const languageBarPopoverBodyClassName = "border-t border-border pt-4";

const languageBarPopoverCloseClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground";

const languagePickerPanelClass = "origin-top-right";

const languagePickerSearchWrapClassName =
  "flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2";

const languagePickerDisplayWrapClassName =
  "group flex w-full cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted/30";

const languagePickerDisplayTextClassName =
  "min-w-0 flex-1 truncate text-sm font-medium text-foreground";

const languagePickerEditHintClassName =
  "shrink-0 text-sm text-foreground/70 opacity-0 transition-opacity group-hover:opacity-100";

const languagePickerSearchInputClassName =
  "min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/55";

const languagePickerListClassName =
  "mt-2 max-h-44 overflow-y-auto rounded-2xl border border-border bg-background p-1";

const languagePickerOptionClassName =
  "flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors";

function filterLanguageOptions(options: Lang[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return options.filter(
    (language) =>
      language.name.toLowerCase().includes(normalized) ||
      language.code.toLowerCase().includes(normalized),
  );
}

function SearchableLanguagePicker({
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
  const [query, setQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((language) => language.code === value);
  const isSearching = query.trim().length > 0;

  const filteredOptions = useMemo(
    () => filterLanguageOptions(options, query),
    [options, query],
  );

  const showResults = isEditing && isSearching && filteredOptions.length > 0;

  const startEditing = useCallback(() => {
    if (disabled) return;
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [disabled]);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    setQuery("");
  }, []);

  return (
    <section className="min-w-0 flex-1" aria-labelledby={`${id}-subtitle`}>
      <p
        id={`${id}-subtitle`}
        className="mb-2 text-sm font-medium text-foreground"
      >
        {subtitle}
      </p>

      {isEditing ? (
        <>
          <label htmlFor={`${id}-search`} className="sr-only">
            Search {subtitle.toLowerCase()}
          </label>
          <div className={languagePickerSearchWrapClassName}>
            <Search
              className="size-3.5 shrink-0 text-foreground/70"
              strokeWidth={1.5}
              aria-hidden
            />
            <input
              ref={inputRef}
              id={`${id}-search`}
              type="search"
              value={query}
              disabled={disabled}
              placeholder="Search languages…"
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => {
                if (!query.trim()) {
                  stopEditing();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  stopEditing();
                  inputRef.current?.blur();
                }
              }}
              className={languagePickerSearchInputClassName}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {showResults ? (
            <div
              role="listbox"
              aria-labelledby={`${id}-subtitle`}
              className={languagePickerListClassName}
            >
              {filteredOptions.map((language) => {
                const isSelected = language.code === value;
                return (
                  <button
                    key={`${id}-${language.code}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={disabled}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange(language.code);
                      stopEditing();
                    }}
                    className={cn(
                      languagePickerOptionClassName,
                      isSelected
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-foreground hover:bg-muted/60",
                      disabled && "opacity-60",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">{language.name}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-medium tracking-[0.06em] uppercase",
                        isSelected
                          ? "text-primary-foreground/80"
                          : "text-foreground/70",
                      )}
                    >
                      {formatLanguageCodeBadge(language.code)}
                    </span>
                    {isSelected ? (
                      <Check className="size-3.5 shrink-0" strokeWidth={1.5} />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={startEditing}
          className={cn(
            languagePickerDisplayWrapClassName,
            disabled && "cursor-not-allowed opacity-60",
          )}
          aria-label={`Edit ${subtitle.toLowerCase()}, currently ${selected?.name ?? "not selected"}`}
        >
          <span className={languagePickerDisplayTextClassName}>
            {selected?.name ?? "Select language…"}
          </span>
          <span className={languagePickerEditHintClassName} aria-hidden>
            edit
          </span>
        </button>
      )}
    </section>
  );
}

const languageBarTriggerButtonClassName = cn(
  languageBarTriggerClassName,
  "transition-opacity hover:opacity-95",
);

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

  const languagePickerRef = useRef<HTMLDivElement>(null);
  const languagePickerPanelRef = useRef<HTMLDivElement>(null);
  const helpRootRef = useRef<HTMLDivElement>(null);
  const helpPanelRef = useRef<HTMLDivElement>(null);
  const panelWasOpenRef = useRef(false);
  const panelCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (languagePickerRef.current?.contains(target)) return;
      if (languagePickerPanelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!helpOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (helpRootRef.current?.contains(target)) return;
      if (helpPanelRef.current?.contains(target)) return;
      setHelpOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [helpOpen]);

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
  const sourceBadge = formatLanguageCodeBadge(source);
  const targetBadge = formatLanguageCodeBadge(target);

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
    <div className="relative z-30 inline-flex max-w-full shrink-0 flex-nowrap items-center gap-2">
      <div className="relative min-w-0 shrink" ref={languagePickerRef}>
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            setHelpOpen(false);
          }}
          className={languageBarTriggerButtonClassName}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={`Change translation languages, currently ${sourceLabel} to ${targetLabel}`}
        >
          <span className={languageBarLabelClassName}>
            <span className="truncate">
              {sourceBadge} → {targetBadge}
            </span>
          </span>
          <span className={languageBarIconButtonClassName} aria-hidden>
            <Globe className="size-4" strokeWidth={1.5} />
          </span>
        </button>

        {panelMounted ? (
          <LanguageBarFloatingPanel
            open={panelMounted}
            anchorRef={languagePickerRef}
            panelRef={languagePickerPanelRef}
            computeRect={computeLanguagePickerRect}
            role="dialog"
            ariaLabelledBy="language-pair-title"
            ariaDescribedBy="language-pair-instructions"
            className={cn(
              languagePickerPanelClass,
              languageBarPopoverBaseClass,
              "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
              panelEntered && !panelClosing
                ? "translate-y-0 scale-100 opacity-100"
                : "-translate-y-1 scale-[0.98] opacity-0",
              panelClosing && "pointer-events-none",
            )}
          >
            <header className={languageBarPopoverHeaderClassName}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id="language-pair-title" className={languageBarPopoverTitleClassName}>
                    Language pair
                  </p>
                  <p
                    id="language-pair-instructions"
                    className={languageBarPopoverDescriptionClassName}
                  >
                    Pick the language you write in and the one you&apos;re learning.
                    Save when you&apos;re done.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={languageBarPopoverCloseClassName}
                  aria-label="Close language picker"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            </header>

            <div className={cn(languageBarPopoverBodyClassName, "flex flex-col gap-4 sm:flex-row")}>
              <SearchableLanguagePicker
                id="bar-native"
                subtitle="When stuck, I'll write in…"
                value={draftSource}
                options={options}
                disabled={pickerDisabled}
                onChange={setDraftSource}
              />
              <SearchableLanguagePicker
                id="bar-target"
                subtitle="I'm learning…"
                value={draftTarget}
                options={options}
                disabled={pickerDisabled}
                onChange={setDraftTarget}
              />
            </div>

            {error ? (
              <p className="mt-4 text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity,margin-top] duration-200 ease-out",
                hasChanges ? "mt-5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
              )}
              aria-hidden={!hasChanges}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cn(
                    "flex justify-end gap-2 border-t border-border pt-4 transition-[transform,opacity] duration-200 ease-out",
                    hasChanges
                      ? "translate-y-0 opacity-100"
                      : "translate-y-1 opacity-0",
                  )}
                >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full transition-opacity duration-150"
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
                    "h-8 min-w-[4.5rem] rounded-full transition-all duration-200 ease-out",
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
          </LanguageBarFloatingPanel>
        ) : null}
      </div>

      <div className="relative shrink-0" ref={helpRootRef}>
        <button
          type="button"
          onClick={() => {
            setHelpOpen((h) => !h);
            setOpen(false);
          }}
          className="inline-flex shrink-0 items-center gap-1.5 px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground dark:text-foreground/82 dark:hover:text-foreground"
          aria-expanded={helpOpen}
          aria-haspopup="dialog"
          aria-label="How to translate"
        >
          <CircleHelp className="size-5 shrink-0" strokeWidth={1.5} />
          <span>Help</span>
        </button>

        {helpOpen ? (
          <LanguageBarFloatingPanel
            open={helpOpen}
            anchorRef={helpRootRef}
            panelRef={helpPanelRef}
            computeRect={computeHelpPopoverRect}
            role="dialog"
            ariaLabelledBy="translation-help-title"
            ariaDescribedBy="translation-help-instructions"
            className={languageBarPopoverBaseClass}
          >
            <header className={languageBarPopoverHeaderClassName}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id="translation-help-title" className={languageBarPopoverTitleClassName}>
                    How to translate
                  </p>
                  <p
                    id="translation-help-instructions"
                    className={languageBarPopoverDescriptionClassName}
                  >
                    Type{" "}
                    <code className="rounded bg-muted px-1 text-[0.75rem] text-foreground">
                      {"//"}
                    </code>{" "}
                    followed by the word or phrase you want, then press{" "}
                    <kbd className="rounded border border-border bg-muted px-1 font-sans text-xs text-foreground">
                      {triggerKeyLabel}
                    </kbd>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(false)}
                  className={languageBarPopoverCloseClassName}
                  aria-label="Close help"
                >
                  <X className="size-4" strokeWidth={1.5} />
                </button>
              </div>
            </header>

            <div className={languageBarPopoverBodyClassName}>
              <SlashTranslateDemo variant="compact" />
            </div>
          </LanguageBarFloatingPanel>
        ) : null}
      </div>
    </div>
  );
}

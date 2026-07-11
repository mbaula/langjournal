"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  EntryList,
  countEntryTranslations,
  pastEntryAnchorId,
  type EntryRow,
} from "@/components/journal/entry-list";
import type { UserLanguageEntry } from "@/lib/db/onboarding";
import type { LanguageLabelMap } from "@/lib/languages/language-label-map";
import {
  buildPastEntryLanguageTabs,
  filterEntriesByLanguageTab,
  normalizeLanguageCode,
} from "@/lib/languages/past-entries-language-tabs";
import { cn } from "@/lib/utils";
import type { TranslateTrigger } from "@/components/journal/journal-editor";

const PAST_ENTRIES_PAGE_SIZE = 10;

const paginationNavButtonClassName =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

const languageTabButtonClassName =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 ease-out";

type PastEntriesFocusRequest = {
  languageCode: string;
  entryId: string;
};

type PastEntriesSectionProps = {
  entries: EntryRow[];
  targetLanguage?: string;
  sourceLanguage?: string;
  learningLanguages?: readonly UserLanguageEntry[];
  languageLabels?: LanguageLabelMap;
  initialLanguages?: readonly { code: string; name: string }[];
  translateTrigger?: TranslateTrigger;
  onLanguagesSaved?: (source: string, target: string) => void;
  onEntryUpdated?: (entry: EntryRow) => void;
  onEntryDeleted?: (entryId: string) => void;
  initialEditingEntryId?: string | null;
  sectionRef?: React.RefObject<HTMLElement | null>;
  focusRequest?: PastEntriesFocusRequest | null;
  onFocusRequestHandled?: () => void;
};

function formatEntryDay(d: Date | string, locale: string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(locale, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function entryTocTitle(entry: EntryRow, dateLabel: string) {
  const title = entry.title?.trim();
  if (title) {
    return title;
  }
  const preview = entry.body?.replace(/\s+/g, " ").trim();
  if (preview) {
    return preview.length > 48 ? `${preview.slice(0, 48)}…` : preview;
  }
  return dateLabel;
}

function getEntryPageIndex(entries: EntryRow[], entryId: string) {
  const index = entries.findIndex((entry) => entry.id === entryId);
  if (index < 0) {
    return 0;
  }
  return Math.floor(index / PAST_ENTRIES_PAGE_SIZE);
}

function getPastEntriesPage(entries: EntryRow[], page: number) {
  const start = page * PAST_ENTRIES_PAGE_SIZE;
  return entries.slice(start, start + PAST_ENTRIES_PAGE_SIZE);
}

function resolveInitialLanguageTab(
  tabs: Array<{ code: string }>,
  preferred?: string,
) {
  if (tabs.length === 0) {
    return "";
  }

  if (preferred) {
    const match = tabs.find(
      (tab) =>
        normalizeLanguageCode(tab.code) === normalizeLanguageCode(preferred),
    );
    if (match) {
      return match.code;
    }
  }

  return tabs[0]!.code;
}

export function PastEntriesSection({
  entries,
  targetLanguage,
  sourceLanguage,
  learningLanguages = [],
  languageLabels,
  initialLanguages,
  translateTrigger,
  onLanguagesSaved,
  onEntryUpdated,
  onEntryDeleted,
  initialEditingEntryId,
  sectionRef,
  focusRequest,
  onFocusRequestHandled,
}: PastEntriesSectionProps) {
  const t = useTranslations("journal");
  const locale = useLocale();
  const [activeLanguageTab, setActiveLanguageTab] = useState(() =>
    resolveInitialLanguageTab(
      buildPastEntryLanguageTabs(entries, learningLanguages, languageLabels),
      targetLanguage,
    ),
  );
  const [pageByLanguage, setPageByLanguage] = useState<Record<string, number>>(
    {},
  );
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const initialEditHandledRef = useRef(false);
  const focusRequestRef = useRef<PastEntriesFocusRequest | null>(null);

  const languageTabs = useMemo(
    () => buildPastEntryLanguageTabs(entries, learningLanguages, languageLabels),
    [entries, languageLabels, learningLanguages],
  );

  const filteredEntries = useMemo(
    () =>
      activeLanguageTab
        ? filterEntriesByLanguageTab(entries, activeLanguageTab)
        : entries,
    [activeLanguageTab, entries],
  );

  const page = pageByLanguage[activeLanguageTab] ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEntries.length / PAST_ENTRIES_PAGE_SIZE),
  );

  const paginatedEntries = useMemo(
    () => getPastEntriesPage(filteredEntries, page),
    [filteredEntries, page],
  );

  const tocItems = useMemo(
    () =>
      paginatedEntries.map((entry) => {
        const dateLabel = formatEntryDay(entry.entryDate, locale);
        return {
          id: entry.id,
          title: entryTocTitle(entry, dateLabel),
          translationCount: countEntryTranslations(entry.translations),
        };
      }),
    [paginatedEntries, locale],
  );

  const setPageForActiveTab = useCallback(
    (nextPage: number) => {
      if (!activeLanguageTab) return;
      setPageByLanguage((current) => ({
        ...current,
        [activeLanguageTab]: nextPage,
      }));
    },
    [activeLanguageTab],
  );

  useEffect(() => {
    if (languageTabs.length === 0) {
      return;
    }

    const stillValid = languageTabs.some(
      (tab) =>
        normalizeLanguageCode(tab.code) ===
        normalizeLanguageCode(activeLanguageTab),
    );

    if (!stillValid) {
      setActiveLanguageTab(
        resolveInitialLanguageTab(languageTabs, targetLanguage),
      );
    }
  }, [activeLanguageTab, languageTabs, targetLanguage]);

  useEffect(() => {
    if (page > totalPages - 1) {
      setPageForActiveTab(Math.max(0, totalPages - 1));
    }
  }, [page, setPageForActiveTab, totalPages]);

  useEffect(() => {
    if (paginatedEntries.length === 0) {
      setActiveEntryId(null);
      return;
    }

    if (!paginatedEntries.some((entry) => entry.id === activeEntryId)) {
      setActiveEntryId(paginatedEntries[0]!.id);
    }
  }, [activeEntryId, paginatedEntries]);

  useEffect(() => {
    if (
      editingEntryId &&
      !paginatedEntries.some((entry) => entry.id === editingEntryId)
    ) {
      setEditingEntryId(null);
    }
  }, [editingEntryId, paginatedEntries]);

  useEffect(() => {
    if (paginatedEntries.length === 0) {
      return;
    }

    const targets = paginatedEntries
      .map((entry) => document.getElementById(pastEntryAnchorId(entry.id)))
      .filter((node): node is HTMLElement => node != null);

    if (targets.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );

        const topmost = visible[0];
        if (topmost?.target.id) {
          setActiveEntryId(topmost.target.id.replace(/^past-entry-/, ""));
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0,
      },
    );

    for (const target of targets) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [paginatedEntries]);

  useEffect(() => {
    if (
      initialEditHandledRef.current ||
      !initialEditingEntryId ||
      !entries.some((entry) => entry.id === initialEditingEntryId)
    ) {
      return;
    }

    const entry = entries.find((item) => item.id === initialEditingEntryId);
    if (entry?.targetLanguage) {
      setActiveLanguageTab(entry.targetLanguage);
    }

    initialEditHandledRef.current = true;
    setPageByLanguage((current) => ({
      ...current,
      [entry?.targetLanguage ?? activeLanguageTab]: getEntryPageIndex(
        filterEntriesByLanguageTab(
          entries,
          entry?.targetLanguage ?? activeLanguageTab,
        ),
        initialEditingEntryId,
      ),
    }));
    setEditingEntryId(initialEditingEntryId);
    requestAnimationFrame(() => {
      document
        .getElementById(pastEntryAnchorId(initialEditingEntryId))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeLanguageTab, entries, initialEditingEntryId]);

  useEffect(() => {
    if (!focusRequest) {
      focusRequestRef.current = null;
      return;
    }

    if (
      focusRequestRef.current?.entryId === focusRequest.entryId &&
      focusRequestRef.current.languageCode === focusRequest.languageCode
    ) {
      return;
    }

    focusRequestRef.current = focusRequest;
    setActiveLanguageTab(focusRequest.languageCode);
    setPageByLanguage((current) => ({
      ...current,
      [focusRequest.languageCode]: 0,
    }));
    setActiveEntryId(focusRequest.entryId);

    requestAnimationFrame(() => {
      sectionRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      requestAnimationFrame(() => {
        document
          .getElementById(pastEntryAnchorId(focusRequest.entryId))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        onFocusRequestHandled?.();
      });
    });
  }, [focusRequest, onFocusRequestHandled, sectionRef]);

  const scrollToEntry = useCallback((entryId: string) => {
    document.getElementById(pastEntryAnchorId(entryId))?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveEntryId(entryId);
  }, []);

  const handleEditEntry = useCallback(
    (entryId: string) => {
      setEditingEntryId(entryId);
      scrollToEntry(entryId);
    },
    [scrollToEntry],
  );

  const handleEntrySaved = useCallback(
    (entry: EntryRow) => {
      onEntryUpdated?.(entry);
      setEditingEntryId(null);
    },
    [onEntryUpdated],
  );

  const handleEntryDeleted = useCallback(
    (entryId: string) => {
      onEntryDeleted?.(entryId);
      setEditingEntryId((current) => (current === entryId ? null : current));
    },
    [onEntryDeleted],
  );

  const goToPreviousPage = useCallback(() => {
    setPageForActiveTab(Math.max(0, page - 1));
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, sectionRef, setPageForActiveTab]);

  const goToNextPage = useCallback(() => {
    setPageForActiveTab(Math.min(totalPages - 1, page + 1));
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, sectionRef, setPageForActiveTab, totalPages]);

  if (entries.length === 0 || languageTabs.length === 0) {
    return null;
  }

  const showPagination = totalPages > 1;
  const activeTabMeta = languageTabs.find(
    (tab) =>
      normalizeLanguageCode(tab.code) ===
      normalizeLanguageCode(activeLanguageTab),
  );

  const paginationControls = showPagination ? (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">
        {t("pageOn", { page: page + 1, total: totalPages })}
      </span>
      <button
        type="button"
        className={paginationNavButtonClassName}
        aria-label={t("previousPage")}
        disabled={page === 0}
        onClick={goToPreviousPage}
      >
        <ChevronLeft className="size-4" strokeWidth={1.5} />
      </button>
      <button
        type="button"
        className={paginationNavButtonClassName}
        aria-label={t("nextPage")}
        disabled={page >= totalPages - 1}
        onClick={goToNextPage}
      >
        <ChevronRight className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  ) : null;

  return (
    <section
      ref={sectionRef}
      className="space-y-6 border-t border-border pt-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pastEntries")}
        </h2>
        <div
          role="tablist"
          aria-label={t("pastEntriesLanguageFilter")}
          className="flex flex-wrap justify-end gap-2"
        >
          {languageTabs.map((tab) => {
            const isActive =
              normalizeLanguageCode(tab.code) ===
              normalizeLanguageCode(activeLanguageTab);

            return (
              <button
                key={tab.code}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  languageTabButtonClassName,
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
                )}
                onClick={() => {
                  setActiveLanguageTab(tab.code);
                  setEditingEntryId(null);
                }}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "tabular-nums",
                    isActive
                      ? "text-primary-foreground/85"
                      : "text-muted-foreground",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("noEntriesInLanguage", {
            language: activeTabMeta?.label ?? activeLanguageTab,
          })}
        </p>
      ) : (
        <>
          <div
            key={activeLanguageTab}
            className="flex flex-col gap-8 transition-opacity duration-200 lg:flex-row lg:items-start lg:gap-12 xl:gap-16"
          >
          <nav
            aria-label={t("pastEntriesToc")}
            className="lg:sticky lg:top-24 lg:w-44 lg:shrink-0 xl:w-52"
          >
            <p className="mb-3 hidden text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">
              {t("onThisPage")}
            </p>
            <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
              {tocItems.map((item) => {
                const isActive = activeEntryId === item.id;
                return (
                  <li key={item.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => scrollToEntry(item.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition-colors lg:rounded-md lg:px-2 lg:py-1.5",
                        "border border-border bg-muted/30 lg:border-transparent lg:bg-transparent",
                        isActive
                          ? "border-border bg-muted/70 text-foreground lg:bg-muted/50"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="min-w-0 truncate text-sm leading-snug font-medium">
                          {item.title}
                        </span>
                        {item.translationCount > 0 ? (
                          <span className="shrink-0 rounded-full border border-border bg-background px-1.5 py-px text-xs font-medium tabular-nums text-muted-foreground">
                            {t("translationBadge", {
                              count: item.translationCount,
                            })}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="min-w-0 flex-1">
            <EntryList
              entries={paginatedEntries}
              targetLanguage={activeLanguageTab}
              sourceLanguage={sourceLanguage}
              learningLanguages={learningLanguages}
              languageLabels={languageLabels}
              initialLanguages={initialLanguages}
              translateTrigger={translateTrigger}
              onLanguagesSaved={onLanguagesSaved}
              editingEntryId={editingEntryId}
              onEditEntry={handleEditEntry}
              onEntrySaved={handleEntrySaved}
              onEntryDeleted={handleEntryDeleted}
            />
          </div>
          </div>
          {paginationControls ? (
            <div className="flex justify-end">{paginationControls}</div>
          ) : null}
        </>
      )}
    </section>
  );
}

export type { PastEntriesFocusRequest };

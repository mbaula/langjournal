"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  EntryList,
  countEntryTranslations,
  pastEntryAnchorId,
  type EntryRow,
} from "@/components/journal/entry-list";
import { cn } from "@/lib/utils";
import type { TranslateTrigger } from "@/components/journal/journal-editor";

const PAST_ENTRIES_PAGE_SIZE = 10;

const paginationNavButtonClassName =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

type PastEntriesSectionProps = {
  entries: EntryRow[];
  targetLanguage?: string;
  sourceLanguage?: string;
  translateTrigger?: TranslateTrigger;
  onLanguagesSaved?: (source: string, target: string) => void;
  onEntryUpdated?: (entry: EntryRow) => void;
  onEntryDeleted?: (entryId: string) => void;
  initialEditingEntryId?: string | null;
  sectionRef?: React.RefObject<HTMLElement | null>;
};

function formatEntryDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
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

export function PastEntriesSection({
  entries,
  targetLanguage,
  sourceLanguage,
  translateTrigger,
  onLanguagesSaved,
  onEntryUpdated,
  onEntryDeleted,
  initialEditingEntryId,
  sectionRef,
}: PastEntriesSectionProps) {
  const t = useTranslations("journal");
  const totalPages = Math.max(1, Math.ceil(entries.length / PAST_ENTRIES_PAGE_SIZE));
  const [page, setPage] = useState(0);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(
    entries[0]?.id ?? null,
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const initialEditHandledRef = useRef(false);

  const paginatedEntries = useMemo(
    () => getPastEntriesPage(entries, page),
    [entries, page],
  );

  const tocItems = useMemo(
    () =>
      paginatedEntries.map((entry) => {
        const dateLabel = formatEntryDay(entry.entryDate);
        return {
          id: entry.id,
          title: entryTocTitle(entry, dateLabel),
          translationCount: countEntryTranslations(entry.translations),
        };
      }),
    [paginatedEntries],
  );

  useEffect(() => {
    if (page > totalPages - 1) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalPages]);

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

    initialEditHandledRef.current = true;
    setPage(getEntryPageIndex(entries, initialEditingEntryId));
    setEditingEntryId(initialEditingEntryId);
    requestAnimationFrame(() => {
      document
        .getElementById(pastEntryAnchorId(initialEditingEntryId))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [entries, initialEditingEntryId]);

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
    setPage((current) => Math.max(0, current - 1));
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionRef]);

  const goToNextPage = useCallback(() => {
    setPage((current) => Math.min(totalPages - 1, current + 1));
    sectionRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionRef, totalPages]);

  if (entries.length === 0) {
    return null;
  }

  const showPagination = totalPages > 1;

  return (
    <section
      ref={sectionRef}
      className="space-y-6 border-t border-border pt-8"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pastEntries")}
        </h2>
        {showPagination ? (
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
        ) : null}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
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
                          {t("translationBadge", { count: item.translationCount })}
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
            targetLanguage={targetLanguage}
            sourceLanguage={sourceLanguage}
            translateTrigger={translateTrigger}
            onLanguagesSaved={onLanguagesSaved}
            editingEntryId={editingEntryId}
            onEditEntry={handleEditEntry}
            onEntrySaved={handleEntrySaved}
            onEntryDeleted={handleEntryDeleted}
          />
        </div>
      </div>
    </section>
  );
}

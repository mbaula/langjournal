"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  EntryList,
  countEntryTranslations,
  formatEntrySubtitle,
  pastEntryAnchorId,
  type EntryRow,
} from "@/components/journal/entry-list";
import { getLanguageDisplayName } from "@/lib/languages/display-name";
import { cn } from "@/lib/utils";
import type { TranslateTrigger } from "@/components/journal/journal-editor";

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
  const languageLabel = targetLanguage
    ? getLanguageDisplayName(targetLanguage)
    : null;

  const [activeEntryId, setActiveEntryId] = useState<string | null>(
    entries[0]?.id ?? null,
  );
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const initialEditHandledRef = useRef(false);

  const tocItems = useMemo(
    () =>
      entries.map((entry) => {
        const dateLabel = formatEntryDay(entry.entryDate);
        return {
          id: entry.id,
          title: entryTocTitle(entry, dateLabel),
          dateLabel: formatEntrySubtitle(dateLabel, {
            languageLabel,
            flashcardCount: entry.flashcardCount,
          }),
          translationCount: countEntryTranslations(entry.translations),
        };
      }),
    [entries, languageLabel],
  );

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }

    const targets = entries
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
  }, [entries]);

  useEffect(() => {
    if (
      initialEditHandledRef.current ||
      !initialEditingEntryId ||
      !entries.some((entry) => entry.id === initialEditingEntryId)
    ) {
      return;
    }

    initialEditHandledRef.current = true;
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

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="space-y-6 border-t border-border pt-8"
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        Past entries
      </h2>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
        <nav
          aria-label="Past entries table of contents"
          className="lg:sticky lg:top-24 lg:w-44 lg:shrink-0 xl:w-52"
        >
          <p className="mb-3 hidden text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">
            On this page
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
                          + {item.translationCount}
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground sm:text-sm">
                      {item.dateLabel}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <EntryList
            entries={entries}
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

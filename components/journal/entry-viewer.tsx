"use client";

import Link from "next/link";

import { DeleteEntryControl } from "@/components/journal/delete-entry-control";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import {
  JournalEditor,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";
import { LanguageBar } from "@/components/journal/language-bar";
import { useEntry } from "@/lib/entries/entry-context";

type EntryViewerProps = {
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
};

function formatEntryDay(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function EntryViewer({
  sourceLanguage,
  targetLanguage,
  translateTrigger,
}: EntryViewerProps) {
  const { currentEntry, isLoading, error } = useEntry();

  if (error) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 py-24">
        <p className="text-destructive">{error}</p>
        <Link
          href="/app/journal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Back to journal
        </Link>
      </div>
    );
  }

  if (isLoading && !currentEntry) {
    return (
      <div className="flex w-full flex-col gap-8 pb-24 pt-1">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <nav
              className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link
                href="/app/journal"
                className="truncate hover:text-foreground transition-colors"
              >
                Journal
              </Link>
              <span className="text-muted-foreground/50" aria-hidden>
                /
              </span>
              <span className="h-4 w-24 animate-pulse rounded bg-muted" />
            </nav>
            <div className="h-6 w-28 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-12 w-2/3 animate-pulse rounded bg-muted" />
        </header>
        <div className="flex min-h-[300px] w-full flex-col gap-4">
          <div className="h-6 w-full animate-pulse rounded bg-muted" />
          <div className="h-6 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-6 w-4/6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return null;
  }

  const dayLabel = formatEntryDay(currentEntry.entryDate);

  return (
    <div className="flex w-full flex-col gap-8 pb-24 pt-1">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href="/app/journal"
              className="truncate hover:text-foreground transition-colors"
            >
              Journal
            </Link>
            <span className="text-muted-foreground/50" aria-hidden>
              /
            </span>
            <span className="truncate text-muted-foreground">{dayLabel}</span>
            <span className="text-muted-foreground/50" aria-hidden>
              /
            </span>
            <DeleteEntryControl entryId={currentEntry.id} />
          </nav>
          <div className="shrink-0">
            <LanguageBar
              source={sourceLanguage}
              target={targetLanguage}
              translateTrigger={translateTrigger}
            />
          </div>
        </div>
        <EntryTitleField
          key={currentEntry.id}
          entryId={currentEntry.id}
          initialTitle={currentEntry.title}
        />
      </header>

      <JournalEditor
        key={currentEntry.id}
        entryId={currentEntry.id}
        initialBody={currentEntry.body ?? ""}
        initialTranslations={currentEntry.translations ?? []}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        translateTrigger={translateTrigger}
      />
    </div>
  );
}

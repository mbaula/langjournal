"use client";

import Link from "next/link";
import { BookLock, LogIn, WifiOff, type LucideIcon } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import {
  appPageShellClassName,
  journalPageTitleClassName,
} from "@/components/journal/field-styles";
import {
  JournalEditor,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";
import { LanguageBar } from "@/components/journal/language-bar";
import { Button } from "@/components/ui/button";
import {
  type EntryLoadError,
  useEntry,
} from "@/lib/entries/entry-context";

type EntryViewerProps = {
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
  prompt?: ReactNode;
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

function entryLoadErrorCopy(kind: EntryLoadError["kind"]): {
  title: string;
  description: string;
  Icon: LucideIcon;
} {
  switch (kind) {
    case "inaccessible":
      return {
        title: "This entry isn’t available",
        description:
          "You can only open entries from your own journal. This link may be wrong, or the entry may belong to another account.",
        Icon: BookLock,
      };
    case "session":
      return {
        title: "Sign in required",
        description:
          "Your session may have expired. Sign in again to open your entries.",
        Icon: LogIn,
      };
    default:
      return {
        title: "Couldn’t load this entry",
        description:
          "Something went wrong on our side or with your connection. Try again in a moment.",
        Icon: WifiOff,
      };
  }
}

export function EntryViewer({
  sourceLanguage: initialSourceLanguage,
  targetLanguage: initialTargetLanguage,
  translateTrigger,
  prompt,
}: EntryViewerProps) {
  const [sourceLanguage, setSourceLanguage] = useState(initialSourceLanguage);
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLanguage);
  const handleLanguagesSaved = useCallback(
    (source: string, target: string) => {
      setSourceLanguage(source);
      setTargetLanguage(target);
    },
    [],
  );

  const { currentEntry, isLoading, loadError, removeEntryFromCache } = useEntry();
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const handleRename = useCallback((entryId: string) => {
    const el = document.getElementById(`entry-title-${entryId}`);
    if (el instanceof HTMLInputElement) {
      el.focus();
      el.select();
    }
  }, []);

  const handleDelete = useCallback(
    async (entryId: string) => {
      setDeletePending(true);
      try {
        const result = await deleteJournalEntryRequest(entryId);
        if (result.ok) {
          removeEntryFromCache(entryId);
          window.location.assign("/app/journal");
        }
      } finally {
        setDeletePending(false);
        setDeleteConfirming(false);
      }
    },
    [removeEntryFromCache],
  );

  if (loadError) {
    const { title, description, Icon } = entryLoadErrorCopy(loadError.kind);

    return (
      <div className={appPageShellClassName}>
        <header className="flex flex-col gap-6">
          <nav
            className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href="/app/journal"
              className="truncate transition-colors hover:text-foreground"
            >
              Journal
            </Link>
            <span className="text-muted-foreground/50" aria-hidden>
              /
            </span>
            <span className="truncate text-muted-foreground">Entry</span>
          </nav>
        </header>

        <div className="flex w-full justify-center px-2 sm:px-0">
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm"
            role="alert"
          >
            <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-7 stroke-[1.5]" aria-hidden />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
              <Button nativeButton={false} render={<Link href="/app/journal" />}>
                Back to journal
              </Button>
              {loadError.kind === "session" ? (
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Sign in
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !currentEntry) {
    return (
      <div className={appPageShellClassName}>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-10 lg:gap-y-8">
          <header className="min-w-0 space-y-2">
            <nav
              className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
              aria-label="Breadcrumb"
            >
              <Link
                href="/app/journal"
                className="truncate transition-colors hover:text-foreground"
              >
                Journal
              </Link>
              <span className="text-muted-foreground/50" aria-hidden>
                /
              </span>
              <span className="h-4 w-24 animate-pulse rounded bg-muted" />
            </nav>
            <div className="h-9 w-2/3 max-w-md animate-pulse rounded bg-muted" />
          </header>
          <div className="h-10 w-full max-w-[12rem] animate-pulse rounded bg-muted lg:w-48" />
          <div className="flex min-h-[300px] w-full flex-col gap-4 lg:col-span-2">
            <div className="h-6 w-full animate-pulse rounded bg-muted" />
            <div className="h-6 w-5/6 animate-pulse rounded bg-muted" />
            <div className="h-6 w-4/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentEntry) {
    return null;
  }

  const dayLabel = formatEntryDay(currentEntry.entryDate);

  return (
    <div className={appPageShellClassName}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-x-10 lg:gap-y-8">
        <header className="min-w-0 space-y-1">
          <nav
            className="flex min-w-0 flex-wrap items-center gap-1 text-[13px] text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link
              href="/app/journal"
              className="truncate transition-colors hover:text-foreground"
            >
              Journal
            </Link>
            <span className="text-muted-foreground/50" aria-hidden>
              /
            </span>
            <span className="truncate text-muted-foreground">{dayLabel}</span>
          </nav>
          <EntryTitleField
            key={currentEntry.id}
            entryId={currentEntry.id}
            initialTitle={currentEntry.title}
            inputId={`entry-title-${currentEntry.id}`}
            className={journalPageTitleClassName}
          />
        </header>

        <div className="relative flex w-full min-w-0 shrink-0 flex-nowrap items-center justify-end gap-2 lg:w-auto">
          <LanguageBar
            source={sourceLanguage}
            target={targetLanguage}
            translateTrigger={translateTrigger}
            onLanguagesSaved={handleLanguagesSaved}
          />
          <EntryActionsMenu
            entryId={currentEntry.id}
            onRenameTitle={handleRename}
            onDelete={() => setDeleteConfirming(true)}
            className="pointer-events-auto pr-0 opacity-100"
            triggerClassName="text-muted-foreground"
          />
          {deleteConfirming ? (
            <div className="absolute right-0 top-full z-40 mt-2 rounded-md border border-border bg-popover px-2 py-1 text-[12px] shadow-sm">
              <p className="text-muted-foreground">Delete this entry?</p>
              <div className="mt-1 flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={deletePending}
                  onClick={() => setDeleteConfirming(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-destructive transition-colors hover:bg-destructive/10"
                  disabled={deletePending}
                  onClick={() => void handleDelete(currentEntry.id)}
                >
                  {deletePending ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 lg:col-span-2">
          {prompt}
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
      </div>
    </div>
  );
}

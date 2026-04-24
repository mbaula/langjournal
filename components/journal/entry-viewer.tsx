"use client";

import Link from "next/link";
import { BookLock, LogIn, WifiOff, type LucideIcon } from "lucide-react";

import { DeleteEntryControl } from "@/components/journal/delete-entry-control";
import { EntryTitleField } from "@/components/journal/entry-title-field";
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
  sourceLanguage,
  targetLanguage,
  translateTrigger,
}: EntryViewerProps) {
  const { currentEntry, isLoading, loadError } = useEntry();

  if (loadError) {
    const { title, description, Icon } = entryLoadErrorCopy(loadError.kind);

    return (
      <div className="flex w-full flex-col gap-8 pb-24 pt-1">
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
            className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 text-center shadow-sm backdrop-blur-sm dark:border-input dark:bg-card/40"
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

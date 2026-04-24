import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteEntryControl } from "@/components/journal/delete-entry-control";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import {
  type InlineTranslation,
  JournalEditor,
} from "@/components/journal/journal-editor";
import { LanguageBar } from "@/components/journal/language-bar";
import { requireUser } from "@/lib/auth/session";
import { getLanguagePair } from "@/lib/db/language";
import { getJournalEntryForUser } from "@/lib/entries/service";

type EntryPageProps = {
  params: Promise<{ id: string }>;
};

function formatEntryDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function EntryPage({ params }: EntryPageProps) {
  const user = await requireUser();
  const { id } = await params;

  const entry = await getJournalEntryForUser(id, user.id);
  if (!entry) {
    notFound();
  }

  const translations: InlineTranslation[] = Array.isArray(entry.translations)
    ? (entry.translations as InlineTranslation[])
    : [];

  const { source, target } = await getLanguagePair(user.id);

  const dayLabel = formatEntryDay(entry.entryDate);

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
            <DeleteEntryControl entryId={entry.id} />
          </nav>
          <div className="shrink-0">
            <LanguageBar source={source} target={target} />
          </div>
        </div>
        <EntryTitleField
          key={entry.id}
          entryId={entry.id}
          initialTitle={entry.title}
        />
      </header>

      <JournalEditor
        key={entry.id}
        entryId={entry.id}
        initialBody={entry.body ?? ""}
        initialTranslations={translations}
        sourceLanguage={source}
        targetLanguage={target}
      />
    </div>
  );
}

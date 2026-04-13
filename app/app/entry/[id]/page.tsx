import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryTitleField } from "@/components/journal/entry-title-field";
import {
  type InlineTranslation,
  JournalEditor,
} from "@/components/journal/journal-editor";
import { LanguageBar } from "@/components/journal/language-bar";
import { buttonVariants } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getLanguagePair } from "@/lib/db/language";
import { getJournalEntryForUser } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

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

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 pb-16 pt-2">
      <header className="flex flex-col gap-4 border-border/60 border-b pb-6">
        <Link
          href="/app/journal"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 w-fit text-muted-foreground hover:text-foreground",
          )}
        >
          ← All entries
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <EntryTitleField
              key={entry.id}
              entryId={entry.id}
              initialTitle={entry.title}
            />
            <p className="text-sm text-muted-foreground">
              {formatEntryDay(entry.entryDate)}
            </p>
          </div>
          <div className="shrink-0">
            <LanguageBar source={source} target={target} />
          </div>
        </div>
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

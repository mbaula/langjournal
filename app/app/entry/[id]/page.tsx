import Link from "next/link";
import { notFound } from "next/navigation";

import { Editor } from "@/components/journal/editor";
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

  const { source, target } = await getLanguagePair(user.id);

  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-col gap-2">
        <Link
          href="/app/journal"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit px-0",
          )}
        >
          ← All entries
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">
            {entry.title?.trim() || formatEntryDay(entry.entryDate)}
          </h1>
          <p className="text-xs text-muted-foreground">
            {formatEntryDay(entry.entryDate)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-6">
        <LanguageBar source={source} target={target} />
        <div className="w-full max-w-xl px-0 sm:px-2">
          <Editor />
        </div>
      </div>
    </div>
  );
}

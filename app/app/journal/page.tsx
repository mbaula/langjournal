import { CreateEntryButton } from "@/components/journal/create-entry-button";
import { EntryList } from "@/components/journal/entry-list";
import { requireUser } from "@/lib/auth/session";
import { listJournalEntries } from "@/lib/entries/service";

export default async function JournalPage() {
  const user = await requireUser();
  const entries = await listJournalEntries(user.id);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 pt-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-medium tracking-tight text-muted-foreground">
          Journal
        </h1>
        <p className="text-sm text-muted-foreground">One note per calendar day (UTC).</p>
      </div>
      <div className="flex w-full flex-col gap-4">
        <EntryList entries={entries} />
        <CreateEntryButton />
      </div>
    </div>
  );
}

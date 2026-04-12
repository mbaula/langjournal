import { CreateEntryButton } from "@/components/journal/create-entry-button";
import { EntryList } from "@/components/journal/entry-list";
import { requireUser } from "@/lib/auth/session";
import { listJournalEntries } from "@/lib/entries/service";

export default async function JournalPage() {
  const user = await requireUser();
  const entries = await listJournalEntries(user.id);

  return (
    <div className="flex flex-col items-center gap-8 pt-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-medium text-muted-foreground">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Your entries by day. One entry per calendar day (UTC).
        </p>
      </div>
      <CreateEntryButton />
      <EntryList entries={entries} />
    </div>
  );
}

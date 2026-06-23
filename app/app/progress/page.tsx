import { JournalProgressView } from "@/components/journal/journal-progress-view";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  getDevPreviewContributionData,
  getDevPreviewJournalEntries,
  getDevPreviewJournalStats,
} from "@/lib/dev/preview-account";
import {
  getContributionData,
  getJournalStats,
  isPastJournalEntry,
  listJournalEntries,
} from "@/lib/entries/service";

export default async function ProgressPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const pastEntries = getDevPreviewJournalEntries().filter((entry) =>
      isPastJournalEntry(entry.entryDate),
    );

    return (
      <JournalProgressView
        stats={getDevPreviewJournalStats()}
        contributions={getDevPreviewContributionData()}
        entries={pastEntries}
      />
    );
  }

  const user = await requireAppSession();
  const [stats, contributions, entries] = await Promise.all([
    getJournalStats(user.id),
    getContributionData(user.id),
    listJournalEntries(user.id),
  ]);

  const pastEntries = entries.filter((entry) =>
    isPastJournalEntry(entry.entryDate),
  );

  return (
    <JournalProgressView
      stats={stats}
      contributions={contributions}
      entries={pastEntries}
    />
  );
}

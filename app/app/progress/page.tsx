import { JournalProgressView } from "@/components/journal/journal-progress-view";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  getDevPreviewContributionData,
  getDevPreviewJournalStats,
} from "@/lib/dev/preview-account";
import {
  getContributionData,
  getJournalStats,
} from "@/lib/entries/service";

export default async function ProgressPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    return (
      <JournalProgressView
        stats={getDevPreviewJournalStats()}
        contributions={getDevPreviewContributionData()}
      />
    );
  }

  const user = await requireAppSession();
  const [stats, contributions] = await Promise.all([
    getJournalStats(user.id),
    getContributionData(user.id),
  ]);

  return (
    <JournalProgressView stats={stats} contributions={contributions} />
  );
}

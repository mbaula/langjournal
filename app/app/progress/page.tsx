import { JournalProgressView } from "@/components/journal/journal-progress-view";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";
import {
  getDevPreviewContributionData,
  getDevPreviewJournalStats,
  getDevPreviewOnboardingState,
  getDevPreviewTranslationProgress,
} from "@/lib/dev/preview-account";
import {
  getContributionData,
  getJournalStats,
  getJournalTranslationProgress,
} from "@/lib/entries/service";
import { journalGreetingName } from "@/lib/journal/greeting";

export default async function ProgressPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const onboarding = getDevPreviewOnboardingState();
    return (
      <JournalProgressView
        stats={getDevPreviewJournalStats()}
        studentName={journalGreetingName(
          onboarding.displayName,
          "alex.preview@folio.local",
        )}
        contributions={getDevPreviewContributionData()}
        translationProgress={getDevPreviewTranslationProgress()}
      />
    );
  }

  const user = await requireAppSession("/app/progress");
  const [stats, contributions, translationProgress, onboarding] =
    await Promise.all([
      getJournalStats(user.id),
      getContributionData(user.id),
      getJournalTranslationProgress(user.id),
      getOnboardingState(user.id),
    ]);

  return (
    <JournalProgressView
      stats={stats}
      studentName={journalGreetingName(onboarding.displayName, user.email)}
      contributions={contributions}
      translationProgress={translationProgress}
    />
  );
}

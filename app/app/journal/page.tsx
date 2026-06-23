import { DailyPromptSection } from "@/components/journal/daily-prompt-section";
import { appPageShellClassName } from "@/components/journal/field-styles";
import { JournalHomeHeader } from "@/components/journal/journal-home-header";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  DEV_PREVIEW_ENTRY_ID,
  getDevPreviewLanguagePair,
  getDevPreviewOnboardingState,
} from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";
import { getLanguagePair } from "@/lib/db/language";
import {
  journalGreetingName,
  pickEncouragingSubtitle,
} from "@/lib/journal/greeting";
import { getOrCreateJournalEntryForDate } from "@/lib/entries/service";

type JournalHomeBodyProps = {
  greetingName: string;
  encouragingSubtitle: string;
  source: string;
  target: string;
  userId: string;
  todayEntryId: string;
  showDailyPrompt: boolean;
};

function JournalHomeBody({
  greetingName,
  encouragingSubtitle,
  source,
  target,
  userId,
  todayEntryId,
  showDailyPrompt,
}: JournalHomeBodyProps) {
  return (
    <div className={appPageShellClassName}>
      <JournalHomeHeader
        greetingName={greetingName}
        subtitle={encouragingSubtitle}
        source={source}
        target={target}
      />

      {showDailyPrompt ? (
        <DailyPromptSection
          entryId={todayEntryId}
          userId={userId}
          isToday
        />
      ) : null}
    </div>
  );
}

export default async function JournalPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const { source, target } = getDevPreviewLanguagePair();
    const onboarding = getDevPreviewOnboardingState();
    const greetingName = journalGreetingName(
      onboarding.displayName,
      "alex.preview@folio.local",
    );
    const encouragingSubtitle = pickEncouragingSubtitle();

    return (
      <JournalHomeBody
        greetingName={greetingName}
        encouragingSubtitle={encouragingSubtitle}
        source={source}
        target={target}
        userId=""
        todayEntryId={DEV_PREVIEW_ENTRY_ID}
        showDailyPrompt={false}
      />
    );
  }

  const user = await requireAppSession();
  const [{ entry: todayEntry }, { source, target }, onboarding] =
    await Promise.all([
      getOrCreateJournalEntryForDate(user.id, new Date()),
      getLanguagePair(user.id),
      getOnboardingState(user.id),
    ]);

  const greetingName = journalGreetingName(onboarding.displayName, user.email);
  const encouragingSubtitle = pickEncouragingSubtitle();

  return (
    <JournalHomeBody
      greetingName={greetingName}
      encouragingSubtitle={encouragingSubtitle}
      source={source}
      target={target}
      userId={user.id}
      todayEntryId={todayEntry.id}
      showDailyPrompt
    />
  );
}

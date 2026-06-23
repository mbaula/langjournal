import { EntryList } from "@/components/journal/entry-list";
import { DailyPromptSection } from "@/components/journal/daily-prompt-section";
import { appPageShellClassName } from "@/components/journal/field-styles";
import { JournalHomeHeader } from "@/components/journal/journal-home-header";
import { JournalProgressRail } from "@/components/journal/journal-progress-rail";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  DEV_PREVIEW_ENTRY_ID,
  getDevPreviewContributionData,
  getDevPreviewJournalEntries,
  getDevPreviewJournalStats,
  getDevPreviewLanguagePair,
  getDevPreviewOnboardingState,
} from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";
import { getLanguagePair } from "@/lib/db/language";
import {
  journalGreetingName,
  pickEncouragingSubtitle,
} from "@/lib/journal/greeting";
import {
  getContributionData,
  getJournalStats,
  getOrCreateJournalEntryForDate,
  listJournalEntries,
} from "@/lib/entries/service";

type JournalHomeBodyProps = {
  greetingName: string;
  encouragingSubtitle: string;
  source: string;
  target: string;
  userId: string;
  todayEntryId: string;
  entries: Awaited<ReturnType<typeof listJournalEntries>>;
  stats: Awaited<ReturnType<typeof getJournalStats>>;
  contributions: Awaited<ReturnType<typeof getContributionData>>;
  showDailyPrompt: boolean;
};

function JournalHomeBody({
  greetingName,
  encouragingSubtitle,
  source,
  target,
  userId,
  todayEntryId,
  entries,
  stats,
  contributions,
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

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-x-10 lg:gap-y-8">
        <div className="order-3 min-w-0 lg:order-none">
          {showDailyPrompt ? (
            <DailyPromptSection
              entryId={todayEntryId}
              userId={userId}
              isToday
            />
          ) : null}
          <EntryList entries={entries} />
        </div>

        <JournalProgressRail
          stats={stats}
          contributions={contributions}
          className="order-2 lg:order-none lg:sticky lg:top-6 lg:self-start"
        />
      </div>
    </div>
  );
}

export default async function JournalPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const entries = getDevPreviewJournalEntries();
    const { source, target } = getDevPreviewLanguagePair();
    const stats = getDevPreviewJournalStats();
    const contributions = getDevPreviewContributionData();
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
        entries={entries}
        stats={stats}
        contributions={contributions}
        showDailyPrompt={false}
      />
    );
  }

  const user = await requireAppSession();
  const [
    { entry: todayEntry, created: todayEntryCreated },
    entries,
    { source, target },
    stats,
    contributions,
    onboarding,
  ] = await Promise.all([
    getOrCreateJournalEntryForDate(user.id, new Date()),
    listJournalEntries(user.id),
    getLanguagePair(user.id),
    getJournalStats(user.id),
    getContributionData(user.id),
    getOnboardingState(user.id),
  ]);

  const displayEntries =
    todayEntryCreated && !entries.some((e) => e.id === todayEntry.id)
      ? [
          {
            id: todayEntry.id,
            title: todayEntry.title,
            body: todayEntry.body,
            translations: todayEntry.translations,
            entryDate: todayEntry.entryDate,
            createdAt: todayEntry.createdAt,
            updatedAt: todayEntry.updatedAt,
          },
          ...entries,
        ]
      : entries;

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
      entries={displayEntries}
      stats={stats}
      contributions={contributions}
      showDailyPrompt
    />
  );
}

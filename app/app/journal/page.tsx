import { CreateEntryButton } from "@/components/journal/create-entry-button";
import { EntryList } from "@/components/journal/entry-list";
import { journalPageShellClassName, journalPageTitleClassName } from "@/components/journal/field-styles";
import { JournalProgressRail } from "@/components/journal/journal-progress-rail";
import { LanguageBar } from "@/components/journal/language-bar";
import { isAccountPreviewMode, requireUser } from "@/lib/auth/session";
import {
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
  listJournalEntries,
  utcCalendarDate,
} from "@/lib/entries/service";

function isSameUtcDay(a: Date, b: Date): boolean {
  return utcCalendarDate(a).getTime() === utcCalendarDate(b).getTime();
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
    const today = new Date();
    const todayEntry = entries.find((e) => isSameUtcDay(e.entryDate, today));

    return (
      <div className={journalPageShellClassName}>
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-x-10 lg:gap-y-8">
          <header className="min-w-0 space-y-1">
            <h1 className={journalPageTitleClassName}>
              Hi, {greetingName} 👋
            </h1>
            <p className="text-[13px] text-muted-foreground">
              {encouragingSubtitle}
            </p>
          </header>

          <div className="flex justify-start lg:justify-end">
            <LanguageBar source={source} target={target} />
          </div>

          <div className="order-3 min-w-0 lg:order-none">
            <EntryList entries={entries} />
          </div>

          <JournalProgressRail
            stats={stats}
            contributions={contributions}
            className="order-2 lg:sticky lg:top-6 lg:order-none lg:self-start"
          />
        </div>

        <CreateEntryButton todayEntryId={todayEntry?.id} floating />
      </div>
    );
  }

  const user = await requireUser();
  const [entries, { source, target }, stats, contributions, onboarding] =
    await Promise.all([
      listJournalEntries(user.id),
      getLanguagePair(user.id),
      getJournalStats(user.id),
      getContributionData(user.id),
      getOnboardingState(user.id),
    ]);

  const greetingName = journalGreetingName(onboarding.displayName, user.email);
  const encouragingSubtitle = pickEncouragingSubtitle();

  const today = new Date();
  const todayEntry = entries.find((e) => isSameUtcDay(e.entryDate, today));

  return (
    <div className={journalPageShellClassName}>
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-x-10 lg:gap-y-8">
        <header className="min-w-0 space-y-1">
          <h1 className={journalPageTitleClassName}>
            Hi, {greetingName} 👋
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {encouragingSubtitle}
          </p>
        </header>

        <div className="flex justify-start lg:justify-end">
          <LanguageBar source={source} target={target} />
        </div>

        <div className="order-3 min-w-0 lg:order-none">
          <EntryList entries={entries} />
        </div>

        <JournalProgressRail
          stats={stats}
          contributions={contributions}
          className="order-2 lg:sticky lg:top-6 lg:order-none lg:self-start"
        />
      </div>

      <CreateEntryButton todayEntryId={todayEntry?.id} floating />
    </div>
  );
}

import { ContributionChart } from "@/components/journal/contribution-chart";
import { CreateEntryButton } from "@/components/journal/create-entry-button";
import { EntryList } from "@/components/journal/entry-list";
import { LanguageBar } from "@/components/journal/language-bar";
import { StreakTracker } from "@/components/journal/streak-tracker";
import { requireUser } from "@/lib/auth/session";
import { getLanguagePair } from "@/lib/db/language";
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
  const user = await requireUser();
  const [entries, { source, target }, stats, contributions] = await Promise.all([
    listJournalEntries(user.id),
    getLanguagePair(user.id),
    getJournalStats(user.id),
    getContributionData(user.id),
  ]);

  const today = new Date();
  const todayEntry = entries.find((e) => isSameUtcDay(e.entryDate, today));

  return (
    <div className="flex w-full flex-col gap-10 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="text-[1.875rem] font-bold tracking-[-0.02em] text-foreground">
            Journal
          </h1>
          <p className="text-[13px] text-muted-foreground">
            One note per calendar day (UTC).
          </p>
        </div>
        <div className="shrink-0">
          <LanguageBar source={source} target={target} />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <StreakTracker stats={stats} />
        <ContributionChart data={contributions} />
      </div>
      <div className="flex w-full flex-col gap-12">
        <EntryList entries={entries} />
      </div>
      <CreateEntryButton todayEntryId={todayEntry?.id} floating />
    </div>
  );
}

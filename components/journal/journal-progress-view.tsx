import type { ReactNode } from "react";

import { ContributionChart } from "@/components/journal/contribution-chart";
import { JournalProgressStats } from "@/components/journal/journal-progress-stats";
import { TranslationProgressChart } from "@/components/journal/translation-progress-chart";
import {
  appPageShellClassName,
  journalPageTitleClassName,
} from "@/components/journal/field-styles";
import type {
  ContributionDay,
  EntryTranslationProgress,
  JournalStats,
} from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type JournalProgressViewProps = {
  stats: JournalStats;
  studentName: string;
  contributions: ContributionDay[];
  translationProgress: EntryTranslationProgress[];
};

function ProgressWidget({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card/50 p-4 backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function JournalProgressView({
  stats,
  studentName,
  contributions,
  translationProgress,
}: JournalProgressViewProps) {
  return (
    <div className={appPageShellClassName}>
      <header className="space-y-1">
        <h1 className={journalPageTitleClassName}>Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track your journaling streaks, vocabulary growth, and activity over
          time.
        </p>
      </header>

      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] xl:gap-4">
        <JournalProgressStats
          stats={stats}
          studentName={studentName}
          className="h-full"
        />
        <ProgressWidget className="flex h-full min-w-0 flex-col">
          <TranslationProgressChart
            data={translationProgress}
            className="flex-1"
          />
        </ProgressWidget>
      </div>

      <ProgressWidget>
        <ContributionChart
          data={contributions}
          title="Activity"
          variant="default"
          monthsPerPage={12}
          fillWidth
        />
      </ProgressWidget>
    </div>
  );
}

import type { ReactNode } from "react";

import { ContributionChart } from "@/components/journal/contribution-chart";
import { JournalProgressStats } from "@/components/journal/journal-progress-stats";
import {
  appPageShellClassName,
  journalPageTitleClassName,
} from "@/components/journal/field-styles";
import type { ContributionDay, JournalStats } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type JournalProgressViewProps = {
  stats: JournalStats;
  contributions: ContributionDay[];
};

function ActivityWidget({
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
  contributions,
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

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:gap-8">
        <JournalProgressStats stats={stats} />
        <ActivityWidget className="min-w-0">
          <ContributionChart
            data={contributions}
            title="Activity"
            variant="default"
          />
        </ActivityWidget>
      </div>
    </div>
  );
}

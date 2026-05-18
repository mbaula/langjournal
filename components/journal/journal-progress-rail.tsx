import type { ReactNode } from "react";

import { ContributionChart } from "@/components/journal/contribution-chart";
import { JournalProgressStats } from "@/components/journal/journal-progress-stats";
import type { ContributionDay, JournalStats } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type JournalProgressRailProps = {
  stats: JournalStats;
  contributions: ContributionDay[];
  className?: string;
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

export function JournalProgressRail({
  stats,
  contributions,
  className,
}: JournalProgressRailProps) {
  return (
    <aside className={cn(className)} aria-label="Journal progress">
      <div className="flex flex-col gap-3">
        <JournalProgressStats stats={stats} />
        <ActivityWidget className="min-w-0">
          <ContributionChart
            data={contributions}
            variant="rail"
            title="Activity"
          />
        </ActivityWidget>
      </div>
    </aside>
  );
}

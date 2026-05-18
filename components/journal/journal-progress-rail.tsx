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
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 border-primary/10 bg-card/50 p-4 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <h2 className="mb-2 text-[10px] font-medium text-muted-foreground">
        {title}
      </h2>
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
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Journal progress"
    >
      <JournalProgressStats stats={stats} />
      <ActivityWidget title="Activity" className="min-w-0">
        <ContributionChart data={contributions} variant="rail" />
      </ActivityWidget>
    </aside>
  );
}

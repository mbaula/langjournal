import { CalendarDays, Flame, TrendingUp } from "lucide-react";

import type { JournalStats } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type StreakTrackerProps = {
  stats: JournalStats;
  className?: string;
};

type StatCardProps = {
  label: string;
  value: number;
  icon?: React.ReactNode;
  highlight?: boolean;
};

function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-border/60 bg-card/50 px-4 py-3 shadow-sm backdrop-blur-sm transition-colors",
        highlight && "border-primary/30 bg-primary/5 dark:bg-primary/10",
      )}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums tracking-tight",
          highlight ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StreakTracker({ stats, className }: StreakTrackerProps) {
  const hasEntryToday = stats.today > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <TrendingUp
          className="size-4 text-muted-foreground"
          strokeWidth={1.75}
        />
        <h2 className="text-sm font-medium text-foreground">Your Progress</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Today"
          value={stats.today}
          icon={
            <Flame
              className={cn(
                "size-3.5",
                hasEntryToday ? "text-orange-500" : "text-muted-foreground/60",
              )}
              strokeWidth={1.75}
            />
          }
          highlight={hasEntryToday}
        />
        <StatCard
          label="This Week"
          value={stats.thisWeek}
          icon={
            <CalendarDays
              className="size-3.5 text-muted-foreground/60"
              strokeWidth={1.75}
            />
          }
        />
        <StatCard
          label="This Month"
          value={stats.thisMonth}
          icon={
            <CalendarDays
              className="size-3.5 text-muted-foreground/60"
              strokeWidth={1.75}
            />
          }
        />
        <StatCard
          label="All Time"
          value={stats.total}
          icon={
            <TrendingUp
              className="size-3.5 text-muted-foreground/60"
              strokeWidth={1.75}
            />
          }
        />
      </div>
    </div>
  );
}

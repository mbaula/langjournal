import { BookOpen, CalendarDays, Languages, Sparkles } from "lucide-react";

import { getLanguageDisplayName } from "@/lib/languages/display-name";
import type { JournalStats } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type JournalProgressStatsProps = {
  stats: JournalStats;
  className?: string;
};

const statCardClass =
  "rounded-xl border border-border bg-card/50 px-3 py-2.5 backdrop-blur-sm";

const labelClass =
  "min-w-0 truncate text-[10px] leading-tight font-medium text-muted-foreground";

const iconClass = "size-3 shrink-0 text-sidebar-primary opacity-70";

type StatCardProps = {
  label: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
};

function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn(statCardClass, className)}>
      <div className="flex min-w-0 items-center gap-1">
        {icon}
        <span className={labelClass}>{label}</span>
      </div>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function LearningLanguagesStat({
  languages,
}: {
  languages: JournalStats["learningLanguages"];
}) {
  return (
    <div className={cn(statCardClass, "flex w-full flex-col gap-1")}>
      <div className="flex min-w-0 items-center gap-1">
        <Languages className={iconClass} strokeWidth={1.5} />
        <span className={labelClass}>Learning</span>
      </div>
      {languages.length > 0 ? (
        <ul className="mt-1 flex w-full flex-col gap-1.5">
          {languages.map((lang) => (
            <li
              key={lang.languageCode}
              className="flex min-w-0 items-center justify-between gap-2 text-sm"
            >
              <span className="truncate font-medium text-foreground">
                {getLanguageDisplayName(lang.languageCode)}
              </span>
              <span className="shrink-0 text-[11px] font-medium text-primary/70 capitalize">
                {lang.level}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground">No languages yet</p>
      )}
    </div>
  );
}

export function JournalProgressStats({
  stats,
  className,
}: JournalProgressStatsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total entries"
          value={stats.total}
          icon={<BookOpen className={iconClass} strokeWidth={1.5} />}
        />
        <StatCard
          label="New words"
          value={stats.translationCount}
          icon={<Sparkles className={iconClass} strokeWidth={1.5} />}
        />
      </div>
      <LearningLanguagesStat languages={stats.learningLanguages} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="This week"
          value={stats.thisWeek}
          icon={<CalendarDays className={iconClass} strokeWidth={1.5} />}
        />
        <StatCard
          label="This month"
          value={stats.thisMonth}
          icon={<CalendarDays className={iconClass} strokeWidth={1.5} />}
        />
      </div>
    </div>
  );
}

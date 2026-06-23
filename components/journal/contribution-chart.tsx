"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ContributionDay } from "@/lib/entries/service";
import {
  CONTRIBUTION_MONTHS_PER_PAGE,
  formatUtcMonthRangeLabel,
  getUtcMonthPageRange,
  maxMonthPageIndex,
  sliceContributionDaysForRange,
} from "@/lib/journal/contribution-range";
import { cn } from "@/lib/utils";

type ContributionChartProps = {
  data: ContributionDay[];
  className?: string;
  /** Section title; when set, shows prev/next month navigation in the header. */
  title?: string;
  /** `rail` — tighter cells for the right widget column */
  variant?: "default" | "rail";
  monthsPerPage?: number;
};

const LAYOUT = {
  default: {
    maxCellSize: 11,
    minCellSize: 6,
  },
  rail: {
    maxCellSize: 9,
    minCellSize: 4,
  },
} as const;

const DAY_LABEL_WIDTH = 28;
const DAY_LABEL_GAP = 4;
const CELL_GAP = 3;
const LEVELS = [
  "bg-muted/80",
  "bg-contribution-fill",
];

function getLevel(count: number): number {
  return count > 0 ? 1 : 0;
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS: { label: string; row: number }[] = [
  { label: "Mon", row: 0 },
  { label: "Wed", row: 2 },
  { label: "Fri", row: 4 },
];

type WeekData = {
  days: (ContributionDay | null)[];
  monthLabel?: string;
};

function buildWeeks(data: ContributionDay[]): WeekData[] {
  if (data.length === 0) return [];

  const firstDate = new Date(data[0].date + "T00:00:00Z");
  const firstDayOfWeek = firstDate.getUTCDay();
  const paddingBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const paddedData: (ContributionDay | null)[] = [
    ...Array(paddingBefore).fill(null),
    ...data,
  ];

  const weeks: WeekData[] = [];
  let currentWeek: (ContributionDay | null)[] = [];
  let lastMonth = -1;

  for (let i = 0; i < paddedData.length; i++) {
    currentWeek.push(paddedData[i]);

    if (currentWeek.length === 7) {
      const firstRealDay = currentWeek.find((d) => d !== null);
      let monthLabel: string | undefined;

      if (firstRealDay) {
        const month = new Date(firstRealDay.date + "T00:00:00Z").getUTCMonth();
        if (month !== lastMonth) {
          monthLabel = MONTH_LABELS[month];
          lastMonth = month;
        }
      }

      weeks.push({ days: currentWeek, monthLabel });
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    const firstRealDay = currentWeek.find((d) => d !== null);
    let monthLabel: string | undefined;
    if (firstRealDay) {
      const month = new Date(firstRealDay.date + "T00:00:00Z").getUTCMonth();
      if (month !== lastMonth) {
        monthLabel = MONTH_LABELS[month];
      }
    }
    weeks.push({ days: currentWeek, monthLabel });
  }

  return weeks;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00Z");
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ContributionChart({
  data,
  className,
  title,
  variant = "default",
  monthsPerPage = CONTRIBUTION_MONTHS_PER_PAGE,
}: ContributionChartProps) {
  const layout = LAYOUT[variant];
  const [pageIndex, setPageIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState<number>(layout.maxCellSize);

  const maxPage = useMemo(
    () => maxMonthPageIndex(data, monthsPerPage),
    [data, monthsPerPage],
  );

  const canGoOlder = pageIndex < maxPage;
  const canGoNewer = pageIndex > 0;

  const { start: rangeStart, end: rangeEnd } = useMemo(
    () => getUtcMonthPageRange(pageIndex, monthsPerPage),
    [pageIndex, monthsPerPage],
  );

  const pageData = useMemo(
    () => sliceContributionDaysForRange(data, rangeStart, rangeEnd),
    [data, rangeStart, rangeEnd],
  );

  const weeks = useMemo(() => buildWeeks(pageData), [pageData]);

  const totalEntries = useMemo(
    () => pageData.reduce((sum, d) => sum + d.count, 0),
    [pageData],
  );

  const rangeLabel = useMemo(
    () => formatUtcMonthRangeLabel(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  );

  useEffect(() => {
    if (pageIndex > maxPage) {
      setPageIndex(maxPage);
    }
  }, [maxPage, pageIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const computeLayout = () => {
      const availableGridWidth =
        viewport.clientWidth - (DAY_LABEL_WIDTH + DAY_LABEL_GAP);
      const weekCount = Math.max(weeks.length, 1);
      const candidate = Math.floor(
        (availableGridWidth - CELL_GAP * (weekCount - 1)) / weekCount,
      );

      setCellSize(
        Math.max(layout.minCellSize, Math.min(layout.maxCellSize, candidate)),
      );
    };

    computeLayout();
    const observer = new ResizeObserver(computeLayout);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [weeks.length, variant, layout.minCellSize, layout.maxCellSize]);

  const navButtonClass =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[10px] font-medium text-muted-foreground">
            {title}
          </h2>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className={navButtonClass}
              aria-label="Previous six months"
              disabled={!canGoOlder}
              onClick={() => setPageIndex((p) => Math.min(maxPage, p + 1))}
            >
              <ChevronLeft className="size-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={navButtonClass}
              aria-label="Next six months"
              disabled={!canGoNewer}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            >
              <ChevronRight className="size-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="overflow-x-hidden pb-2"
      >
        <div className="inline-flex flex-col gap-1">
          <div
            className="flex text-[10px] text-muted-foreground"
            style={{ gap: `${CELL_GAP}px`, paddingLeft: DAY_LABEL_WIDTH + DAY_LABEL_GAP }}
          >
            {weeks.map((week, i) => (
              <div key={i} className="text-center" style={{ width: cellSize }}>
                {week.monthLabel && (
                  <span className="whitespace-nowrap">{week.monthLabel}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex" style={{ gap: DAY_LABEL_GAP }}>
            <div className="relative w-7 text-[10px] text-muted-foreground">
              {DAY_LABELS.map(({ label, row }) => (
                <span
                  key={label}
                  className="absolute right-2 h-[11px] leading-[11px]"
                  style={{ top: row * (cellSize + CELL_GAP) }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
              {weeks.map((week, weekIdx) => (
                <div
                  key={weekIdx}
                  className="flex flex-col"
                  style={{ gap: `${CELL_GAP}px` }}
                >
                  {week.days.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={cn(
                        "rounded-[2px] transition-colors",
                        day ? LEVELS[getLevel(day.count)] : "bg-transparent",
                      )}
                      style={{ width: cellSize, height: cellSize }}
                      title={
                        day
                          ? `${formatDate(day.date)}: ${day.count} ${day.count === 1 ? "entry" : "entries"}`
                          : undefined
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted-foreground">
        <span>
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"} · {rangeLabel}
        </span>
      </div>
    </div>
  );
}

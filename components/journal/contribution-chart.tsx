"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ContributionDay } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type ContributionChartProps = {
  data: ContributionDay[];
  className?: string;
};

const DAY_LABEL_WIDTH = 28;
const DAY_LABEL_GAP = 4;
const CELL_GAP = 3;
const MAX_CELL_SIZE = 11;
const MIN_CELL_SIZE_WITHOUT_SCROLL = 6;
const FALLBACK_SCROLL_CELL_SIZE = 8;

const LEVELS = [
  "bg-muted/80 dark:bg-muted/40",
  "bg-emerald-500 dark:bg-emerald-400",
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

export function ContributionChart({ data, className }: ContributionChartProps) {
  const weeks = useMemo(() => buildWeeks(data), [data]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(MAX_CELL_SIZE);
  const [enableScroll, setEnableScroll] = useState(false);

  const totalEntries = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data],
  );

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

      if (candidate >= MIN_CELL_SIZE_WITHOUT_SCROLL) {
        setCellSize(Math.min(MAX_CELL_SIZE, candidate));
        setEnableScroll(false);
        return;
      }

      setCellSize(FALLBACK_SCROLL_CELL_SIZE);
      setEnableScroll(true);
    };

    computeLayout();
    const observer = new ResizeObserver(computeLayout);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [weeks.length]);

  useEffect(() => {
    if (!enableScroll || !viewportRef.current) return;
    viewportRef.current.scrollLeft = viewportRef.current.scrollWidth;
  }, [enableScroll, weeks.length]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        ref={viewportRef}
        className={cn(
          "pb-2",
          enableScroll ? "overflow-x-auto" : "overflow-x-hidden",
        )}
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
          {totalEntries} {totalEntries === 1 ? "entry" : "entries"} in the last year
        </span>
      </div>
    </div>
  );
}

import type { ContributionDay } from "@/lib/entries/service";

export const CONTRIBUTION_MONTHS_PER_PAGE = 6;

export function utcMonthAdd(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** Page 0 = most recent six calendar months (UTC), inclusive. */
export function getUtcMonthPageRange(
  pageIndex: number,
  monthsPerPage: number = CONTRIBUTION_MONTHS_PER_PAGE,
): { start: Date; end: Date } {
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  const endOffset = pageIndex * monthsPerPage;
  const startOffset = pageIndex * monthsPerPage + (monthsPerPage - 1);

  const endMonth = utcMonthAdd(y, m, -endOffset);
  const startMonth = utcMonthAdd(y, m, -startOffset);

  const start = new Date(Date.UTC(startMonth.year, startMonth.month, 1));
  const end = new Date(Date.UTC(endMonth.year, endMonth.month + 1, 0));
  return { start, end };
}

export function maxMonthPageIndex(
  data: ContributionDay[],
  monthsPerPage: number = CONTRIBUTION_MONTHS_PER_PAGE,
): number {
  if (data.length === 0) return 0;

  const first = new Date(data[0]!.date + "T00:00:00Z");
  const today = new Date();
  const monthsSpan =
    (today.getUTCFullYear() - first.getUTCFullYear()) * 12 +
    (today.getUTCMonth() - first.getUTCMonth()) +
    1;

  return Math.max(0, Math.ceil(monthsSpan / monthsPerPage) - 1);
}

export function sliceContributionDaysForRange(
  data: ContributionDay[],
  start: Date,
  end: Date,
): ContributionDay[] {
  const countByDate = new Map(data.map((d) => [d.date, d.count]));
  const result: ContributionDay[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({ date: key, count: countByDate.get(key) ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return result;
}

export function formatUtcMonthRangeLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

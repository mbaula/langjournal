const CHART_DATE_LOCALE = "en-US";

export function formatProgressChartDateLabel(entryDate: Date | string): string {
  const date =
    typeof entryDate === "string"
      ? new Date(`${entryDate}T00:00:00Z`)
      : entryDate;

  return date.toLocaleDateString(CHART_DATE_LOCALE, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}

export function formatProgressChartTooltipLabel(
  entryDate: Date | string,
  title: string | null,
): string {
  const dateLabel = formatProgressChartDateLabel(entryDate);
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return dateLabel;
  return `${dateLabel} · ${trimmedTitle}`;
}

export function formatProgressChartPointTooltip(
  entryDate: Date | string,
  title: string | null,
  translationPercent: number,
): string {
  return `${formatProgressChartTooltipLabel(entryDate, title)} — ${translationPercent}% translated`;
}

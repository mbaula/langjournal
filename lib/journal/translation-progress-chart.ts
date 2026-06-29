import type { EntryTranslationProgress } from "@/lib/entries/service";

export const PERCENT_TICKS = [0, 25, 50, 75, 100] as const;
export const MAX_X_LABELS = 25;
export const MIN_X_LABEL_SPACING = 22;

export const TRANSLATION_PROGRESS_CHART = {
  height: 220,
  padding: { top: 14, right: 18, bottom: 56, left: 64 },
} as const;

export type TranslationProgressChartPoint = EntryTranslationProgress & {
  entryNumber: number;
  hoverLabel: string;
  x: number;
  y: number;
};

export type TranslationProgressChartLayout = {
  width: number;
  height: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  plotWidth: number;
  plotHeight: number;
  plotBottom: number;
  plotLeft: number;
  plotRight: number;
  plotCenterX: number;
  plotCenterY: number;
};

export function getTranslationProgressChartLayout(
  entryCount: number,
  chartWidth: number,
): TranslationProgressChartLayout {
  const padding = TRANSLATION_PROGRESS_CHART.padding;
  const height = TRANSLATION_PROGRESS_CHART.height;
  const plotHeight = height - padding.top - padding.bottom;
  const width = Math.max(chartWidth, padding.left + padding.right + 1);
  const plotWidth = width - padding.left - padding.right;

  return {
    width,
    height,
    padding,
    plotWidth,
    plotHeight,
    plotBottom: padding.top + plotHeight,
    plotLeft: padding.left,
    plotRight: padding.left + plotWidth,
    plotCenterY: padding.top + plotHeight / 2,
    plotCenterX: padding.left + plotWidth / 2,
  };
}

export function buildTranslationProgressChartPoints(
  data: EntryTranslationProgress[],
  chartWidth: number,
): TranslationProgressChartPoint[] {
  const layout = getTranslationProgressChartLayout(data.length, chartWidth);

  return data.map((entry, index) => {
    const x =
      data.length === 1
        ? layout.padding.left + layout.plotWidth / 2
        : layout.padding.left +
          (index / (data.length - 1)) * layout.plotWidth;
    const y =
      layout.padding.top +
      layout.plotHeight -
      (entry.translationPercent / 100) * layout.plotHeight;

    return {
      ...entry,
      entryNumber: index + 1,
      hoverLabel: `Entry ${index + 1} · ${entry.translationPercent}%`,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
    };
  });
}

export function buildSmoothLinePath(
  points: Array<{ x: number; y: number }>,
  plotBottom?: number,
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0]!.x} ${points[0]!.y}`;
  }

  const atBaseline = (y: number) =>
    plotBottom !== undefined && Math.abs(y - plotBottom) < 0.01;

  const segments = [`M ${points[0]!.x} ${points[0]!.y}`];

  for (let index = 0; index < points.length - 1; index += 1) {
    const point0 = points[index - 1] ?? points[index]!;
    const point1 = points[index]!;
    const point2 = points[index + 1]!;

    if (atBaseline(point1.y) && atBaseline(point2.y)) {
      segments.push(`L ${point2.x} ${point2.y}`);
      continue;
    }

    const point3 = points[index + 2] ?? point2;

    let control1x = point1.x + (point2.x - point0.x) / 6;
    let control1y = point1.y + (point2.y - point0.y) / 6;
    let control2x = point2.x - (point3.x - point1.x) / 6;
    let control2y = point2.y - (point3.y - point1.y) / 6;

    if (
      plotBottom !== undefined &&
      (atBaseline(point1.y) || atBaseline(point2.y))
    ) {
      control1y = Math.min(control1y, plotBottom);
      control2y = Math.min(control2y, plotBottom);
    }

    segments.push(
      `C ${control1x} ${control1y}, ${control2x} ${control2y}, ${point2.x} ${point2.y}`,
    );
  }

  return segments.join(" ");
}

export function pickXTickIndexes(
  length: number,
  plotWidth?: number,
): number[] {
  if (length <= 1) return length === 1 ? [0] : [];

  const widthBasedMax =
    plotWidth === undefined
      ? MAX_X_LABELS
      : Math.min(
          MAX_X_LABELS,
          Math.max(2, Math.floor(plotWidth / MIN_X_LABEL_SPACING)),
        );

  if (length <= widthBasedMax) {
    return Array.from({ length }, (_, index) => index);
  }

  const indexes = new Set<number>([0, length - 1]);
  const innerSlots = widthBasedMax - 2;
  for (let slot = 1; slot <= innerSlots; slot += 1) {
    indexes.add(Math.round((slot / (innerSlots + 1)) * (length - 1)));
  }

  return [...indexes].sort((a, b) => a - b);
}

export function getTranslationProgressPlotMetrics() {
  return getTranslationProgressChartLayout(1, 640);
}

/** @deprecated Use PERCENT_TICKS */
export const Y_TICKS = PERCENT_TICKS;

"use client";

import { ChartColumnIncreasing } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import type { EntryTranslationProgress } from "@/lib/entries/service";
import {
  buildSmoothLinePath,
  buildTranslationProgressChartPoints,
  getTranslationProgressChartLayout,
  PERCENT_TICKS,
  pickXTickIndexes,
} from "@/lib/journal/translation-progress-chart";
import { cn } from "@/lib/utils";

type TranslationProgressChartClientProps = {
  data: EntryTranslationProgress[];
  title: string;
  className?: string;
};

function ChartTitle({ title }: { title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ChartColumnIncreasing
        className="size-[1.125rem] shrink-0 text-sidebar-primary"
        strokeWidth={1.75}
        aria-hidden
      />
      <h2 className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground">
        {title}
      </h2>
    </div>
  );
}

function ChartLegend() {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-5 bg-sidebar-primary" />
        Translation percentage
      </span>
    </div>
  );
}

export function TranslationProgressChartClient({
  data,
  title,
  className,
}: TranslationProgressChartClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [activePointId, setActivePointId] = useState<string | null>(null);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setChartWidth(element.getBoundingClientRect().width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const points = useMemo(
    () =>
      chartWidth > 0
        ? buildTranslationProgressChartPoints(data, chartWidth)
        : [],
    [chartWidth, data],
  );

  const layout = useMemo(() => {
    if (chartWidth <= 0 || data.length === 0) return null;
    return getTranslationProgressChartLayout(data.length, chartWidth);
  }, [chartWidth, data.length]);

  const activePoint =
    points.find((point) => point.id === activePointId) ?? null;
  const linePath = buildSmoothLinePath(points, layout?.plotBottom);
  const xTickIndexes = pickXTickIndexes(points.length, layout?.plotWidth);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <ChartTitle title={title} />
        <ChartLegend />
      </div>

      <figure className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
        <div ref={containerRef} className="relative w-full">
          {activePoint && layout ? (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-sm"
              style={{
                left: `${(activePoint.x / layout.width) * 100}%`,
                top: `${(activePoint.y / layout.height) * 100}%`,
              }}
            >
              {activePoint.hoverLabel}
            </div>
          ) : null}

          {layout ? (
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="h-auto max-h-[min(14rem,36vh)] w-full text-muted-foreground/70"
              role="img"
              aria-label="Line chart of translation share across journal entries"
              onMouseLeave={() => setActivePointId(null)}
            >
              {PERCENT_TICKS.map((tick) => {
                const y =
                  layout.padding.top +
                  layout.plotHeight -
                  (tick / 100) * layout.plotHeight;

                return (
                  <g key={`percent-${tick}`}>
                    <line
                      x1={layout.plotLeft}
                      y1={y}
                      x2={layout.plotRight}
                      y2={y}
                      className="stroke-border/70"
                      strokeWidth={1}
                      strokeDasharray={tick === 0 ? undefined : "4 4"}
                    />
                    <text
                      x={layout.plotLeft - 14}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-xs"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {points.map((point) => (
                <line
                  key={`v-grid-${point.id}`}
                  x1={point.x}
                  y1={layout.padding.top}
                  x2={point.x}
                  y2={layout.plotBottom}
                  className="stroke-border/70"
                  strokeWidth={1}
                />
              ))}

              <line
                x1={layout.plotLeft}
                y1={layout.plotBottom}
                x2={layout.plotRight}
                y2={layout.plotBottom}
                className="stroke-border"
                strokeWidth={1}
              />
              <line
                x1={layout.plotLeft}
                y1={layout.padding.top}
                x2={layout.plotLeft}
                y2={layout.plotBottom}
                className="stroke-border"
                strokeWidth={1}
              />

              <text
                x={14}
                y={layout.plotCenterY}
                transform={`rotate(-90 14 ${layout.plotCenterY})`}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium"
              >
                Translation percentage
              </text>
              <text
                x={layout.plotCenterX}
                y={layout.height - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-medium"
              >
                Entries
              </text>

              {points.length > 1 ? (
                <path
                  d={linePath}
                  fill="none"
                  className="stroke-sidebar-primary"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              ) : null}

              {points.map((point) => (
                <g key={point.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={8}
                    className="cursor-pointer fill-transparent"
                    onMouseEnter={() => setActivePointId(point.id)}
                    onFocus={() => setActivePointId(point.id)}
                    onBlur={() => setActivePointId(null)}
                    tabIndex={0}
                    aria-label={point.hoverLabel}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={2.5}
                    className="pointer-events-none fill-sidebar-primary"
                  />
                </g>
              ))}

              {xTickIndexes.map((index) => {
                const point = points[index];
                if (!point) return null;

                return (
                  <text
                    key={`${point.id}-label`}
                    x={point.x}
                    y={layout.plotBottom + 18}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs tabular-nums"
                  >
                    {point.entryNumber}
                  </text>
                );
              })}
            </svg>
          ) : (
            <div
              className="max-h-[min(14rem,36vh)] w-full"
              aria-hidden="true"
            />
          )}
        </div>

        <figcaption className="sr-only">
          Translation share for each journal entry from oldest to newest.
        </figcaption>
      </figure>
    </div>
  );
}

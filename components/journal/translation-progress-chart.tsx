import { ChartColumnIncreasing } from "lucide-react";

import { TranslationProgressChartClient } from "@/components/journal/translation-progress-chart-client";
import type { EntryTranslationProgress } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

export const TRANSLATION_PROGRESS_CHART_TITLE =
  "How much translation did you use?";

type TranslationProgressChartProps = {
  data: EntryTranslationProgress[];
  className?: string;
};

export function TranslationProgressChart({
  data,
  className,
}: TranslationProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn("flex h-full min-h-0 flex-col gap-4", className)}>
        <div className="flex min-w-0 items-center gap-2">
          <ChartColumnIncreasing
            className="size-[1.125rem] shrink-0 text-sidebar-primary"
            strokeWidth={1.75}
            aria-hidden
          />
          <h2 className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground">
            {TRANSLATION_PROGRESS_CHART_TITLE}
          </h2>
        </div>
        <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          Write a journal entry to see your translation progress here.
        </p>
      </div>
    );
  }

  return (
    <TranslationProgressChartClient
      data={data}
      title={TRANSLATION_PROGRESS_CHART_TITLE}
      className={className}
    />
  );
}

import { ChartColumnIncreasing } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { TranslationProgressChartClient } from "@/components/journal/translation-progress-chart-client";
import type { EntryTranslationProgress } from "@/lib/entries/service";
import { cn } from "@/lib/utils";

type TranslationProgressChartProps = {
  data: EntryTranslationProgress[];
  className?: string;
};

export async function TranslationProgressChart({
  data,
  className,
}: TranslationProgressChartProps) {
  const t = await getTranslations("progress");

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
            {t("chartTitle")}
          </h2>
        </div>
        <p className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
          {t("chartEmpty")}
        </p>
      </div>
    );
  }

  return (
    <TranslationProgressChartClient
      data={data}
      title={t("chartTitle")}
      className={className}
    />
  );
}

"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { toCanvas, toJpeg } from "html-to-image";

import {
  dailyPromptActionButtonClassName,
  dailyPromptCardClassName,
  dailyPromptContentClassName,
  dailyPromptTextClassName,
} from "@/components/journal/daily-prompt-styles";
import { getLanguageDisplayName } from "@/lib/languages/display-name";
import type { JournalStats } from "@/lib/entries/service";
import { useOnboardingLabels } from "@/lib/i18n/hooks";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";
import { cn } from "@/lib/utils";

type JournalProgressStatsProps = {
  stats: JournalStats;
  studentName: string;
  className?: string;
};

function formatLevel(
  level: string,
  labels: Record<OnboardingLanguageLevel, string>,
): string {
  if (level in labels) {
    return labels[level as OnboardingLanguageLevel];
  }
  const normalized = level.replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function reportCardFileSlug(studentName: string): string {
  const slug = studentName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "student";
}

const REPORT_CARD_EXPORT_PIXEL_RATIO = 3;

function parsePx(value: string): number {
  const match = value.trim().match(/^([\d.]+)px$/);
  return match ? Number.parseFloat(match[1]) : 0;
}

function shouldIncludeExportNode(element: Node): boolean {
  if (!(element instanceof HTMLElement)) {
    return true;
  }

  return element.dataset.exportIgnore !== "true";
}

async function captureReportCardImage(
  node: HTMLElement,
): Promise<{ dataUrl: string; extension: "png" | "jpg" }> {
  await document.fonts.ready;

  const styles = getComputedStyle(node);
  const backgroundColor = styles.backgroundColor;
  const cornerRadius = parsePx(styles.borderTopLeftRadius);

  const exportOptions = {
    cacheBust: true,
    pixelRatio: REPORT_CARD_EXPORT_PIXEL_RATIO,
    filter: shouldIncludeExportNode,
    style: {
      borderRadius: styles.borderRadius,
      overflow: "hidden",
    },
  };

  const snapshot = await toCanvas(node, exportOptions);

  const output = document.createElement("canvas");
  output.width = snapshot.width;
  output.height = snapshot.height;

  const ctx = output.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create export canvas");
  }

  const radius = cornerRadius * REPORT_CARD_EXPORT_PIXEL_RATIO;

  ctx.beginPath();
  ctx.roundRect(0, 0, output.width, output.height, radius);
  ctx.clip();

  if (backgroundColor && backgroundColor !== "rgba(0, 0, 0, 0)") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, output.width, output.height);
  }

  ctx.drawImage(snapshot, 0, 0);

  try {
    return { dataUrl: output.toDataURL("image/png"), extension: "png" };
  } catch {
    return {
      dataUrl: output.toDataURL("image/jpeg", 0.98),
      extension: "jpg",
    };
  }
}

function ReportCardBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium tracking-wide text-primary-foreground">
      {children}
    </span>
  );
}

function ReportCardStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-3 text-center">
      <p className="text-xs font-medium text-primary-foreground/70">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-primary-foreground">
        {value}
      </p>
    </div>
  );
}

export function JournalProgressStats({
  stats,
  studentName,
  className,
}: JournalProgressStatsProps) {
  const t = useTranslations("progress");
  const { languageLevelLabels } = useOnboardingLabels();
  const cardRef = useRef<HTMLElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    const node = cardRef.current;
    if (!node || downloading) return;

    setDownloading(true);

    try {
      const { dataUrl, extension } = await captureReportCardImage(node);

      const link = document.createElement("a");
      link.download = `folio-report-card-${reportCardFileSlug(studentName)}.${extension}`;
      link.href = dataUrl;
      link.click();
    } catch {
      const styles = getComputedStyle(node);
      const dataUrl = await toJpeg(node, {
        cacheBust: true,
        pixelRatio: REPORT_CARD_EXPORT_PIXEL_RATIO,
        quality: 0.98,
        backgroundColor: styles.backgroundColor,
        filter: shouldIncludeExportNode,
        style: {
          borderRadius: styles.borderRadius,
          overflow: "hidden",
        },
      });

      const link = document.createElement("a");
      link.download = `folio-report-card-${reportCardFileSlug(studentName)}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [downloading, studentName]);

  return (
    <section
      ref={cardRef}
      className={cn(
        dailyPromptCardClassName,
        "flex h-full flex-col shadow-none",
        className,
      )}
      aria-label={t("reportCardAria")}
    >
      <div
        className={cn(
          dailyPromptContentClassName,
          "flex-1 justify-center gap-6 sm:gap-7 lg:gap-8",
        )}
      >
        <div className="flex w-full flex-col items-center gap-5 text-center">
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-sm font-medium text-primary-foreground/75">
              {t("reportCard")}
            </p>
            <button
              type="button"
              data-export-ignore="true"
              className={cn(
                dailyPromptActionButtonClassName,
                "inline-flex size-9 items-center justify-center px-0 disabled:opacity-60",
              )}
              disabled={downloading}
              aria-label={
                downloading ? t("savingReport") : t("downloadReport")
              }
              onClick={() => void handleDownload()}
            >
              <Download className="size-4" strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <p className={dailyPromptTextClassName}>{studentName}</p>

          <p className="text-sm text-primary-foreground/75">
            {t("writingSince", { year: stats.writingSinceYear })}
          </p>

          <div className="flex w-full flex-col items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-foreground/60">
              {t("languagesLearning")}
            </p>
            {stats.learningLanguages.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {stats.learningLanguages.map((lang) => (
                  <ReportCardBadge key={lang.languageCode}>
                    {getLanguageDisplayName(lang.languageCode)} ·{" "}
                    {formatLevel(lang.level, languageLevelLabels)}
                  </ReportCardBadge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-primary-foreground/60">
                {t("noLanguagesYet")}
              </p>
            )}
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-2.5">
          <ReportCardStat label={t("totalEntries")} value={stats.total} />
          <ReportCardStat
            label={t("flashcardsCreated")}
            value={stats.flashcardCount}
          />
        </div>
      </div>
    </section>
  );
}

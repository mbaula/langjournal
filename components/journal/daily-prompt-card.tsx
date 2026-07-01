"use client";

import { ArrowDown, ArrowUp, Check, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  dailyPromptActionButtonClassName,
  dailyPromptCardClassName,
  dailyPromptContentClassName,
  dailyPromptDifficultyButtonClassName,
  dailyPromptDifficultyControlsClassName,
  dailyPromptTextClassName,
} from "@/components/journal/daily-prompt-styles";
import { Button } from "@/components/ui/button";
import type { DailyPromptState } from "@/lib/prompts/prompt-core";
import { previewNextPrompt } from "@/lib/prompts/prompt-core";
import type { UiLocale } from "@/lib/i18n/locales";

type DailyPromptCardProps = {
  entryId: string;
  initialPrompt: DailyPromptState;
  isToday: boolean;
  isPromptAdopted?: boolean;
  onUsePrompt?: (promptText: string) => void;
  usePromptPending?: boolean;
  onPromptChange?: (promptText: string) => void;
};

type PromptActionBody =
  | { action: "skip" }
  | { action: "feedback"; feedback: "too_easy" | "too_hard" };

export function DailyPromptCard({
  entryId,
  initialPrompt,
  isToday,
  isPromptAdopted = false,
  onUsePrompt,
  usePromptPending = false,
  onPromptChange,
}: DailyPromptCardProps) {
  const t = useTranslations("journal.dailyPrompt");
  const locale = useLocale() as UiLocale;
  const [activePrompt, setActivePrompt] = useState<DailyPromptState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const revertRef = useRef<DailyPromptState | null>(null);
  const latestPromptRef = useRef(initialPrompt);

  const prompt = activePrompt ?? initialPrompt;
  latestPromptRef.current = prompt;

  useEffect(() => {
    setActivePrompt(null);
    latestPromptRef.current = initialPrompt;
    revertRef.current = null;
    setActionError(null);
  }, [entryId, initialPrompt]);

  useEffect(() => {
    onPromptChange?.(prompt.text);
  }, [onPromptChange, prompt.text]);

  const runAction = useCallback(
    (body: PromptActionBody) => {
      const feedback = body.action === "feedback" ? body.feedback : undefined;
      const base = latestPromptRef.current;
      const nextPrompt = previewNextPrompt(base, feedback, locale);

      revertRef.current = base;
      latestPromptRef.current = nextPrompt;
      setActivePrompt(nextPrompt);
      setActionError(null);

      void fetch(`/api/entries/${entryId}/daily-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...body,
          target: { level: nextPrompt.level, index: nextPrompt.index },
        }),
      }).catch(() => {
        if (revertRef.current) {
          latestPromptRef.current = revertRef.current;
          setActivePrompt(revertRef.current);
        }
        setActionError(t("saveError"));
      });
    },
    [entryId, locale, t],
  );

  const showEasier = isToday && prompt.canVoteTooHard;
  const showHarder = isToday && prompt.canVoteTooEasy;

  return (
    <div className="flex w-full flex-col gap-2">
      <section
        className={dailyPromptCardClassName}
        aria-label={t("ariaToday")}
      >
        <div className={dailyPromptContentClassName}>
          <div className="flex w-full flex-col items-center gap-5 text-center">
            <div className="flex w-full items-center justify-between gap-3">
              <p className="text-sm font-medium text-primary-foreground/75">
                {t("label")}
              </p>
              <span className="inline-flex shrink-0 items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-2.5 py-0.5 text-xs font-medium tracking-wide text-primary-foreground">
                {prompt.level}
              </span>
            </div>
            <p className={dailyPromptTextClassName}>
              {prompt.text}
            </p>
          </div>

          {isToday ? (
            <div className="flex w-full flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {onUsePrompt ? (
                  <Button
                    type="button"
                    variant="outline"
                    className={dailyPromptActionButtonClassName}
                    disabled={isPromptAdopted || usePromptPending}
                    onClick={() => onUsePrompt(prompt.text)}
                  >
                    {isPromptAdopted ? (
                      <>
                        <Check aria-hidden />
                        {t("added")}
                      </>
                    ) : (
                      t("usePrompt")
                    )}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className={dailyPromptActionButtonClassName}
                  aria-label={t("ariaRefresh")}
                  onClick={() => runAction({ action: "skip" })}
                >
                  <RefreshCw aria-hidden />
                  {t("refresh")}
                </Button>
              </div>
              {actionError ? (
                <p className="text-center text-sm text-primary-foreground/90">
                  {actionError}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {isToday && (showEasier || showHarder) ? (
        <div className={dailyPromptDifficultyControlsClassName}>
          {showEasier ? (
            <button
              type="button"
              className={dailyPromptDifficultyButtonClassName}
              onClick={() =>
                runAction({ action: "feedback", feedback: "too_hard" })
              }
            >
              <ArrowDown className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              {t("easier")}
            </button>
          ) : null}
          {showHarder ? (
            <button
              type="button"
              className={dailyPromptDifficultyButtonClassName}
              onClick={() =>
                runAction({ action: "feedback", feedback: "too_easy" })
              }
            >
              <ArrowUp className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
              {t("harder")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

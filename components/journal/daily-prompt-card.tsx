"use client";

import { ArrowDown, ArrowUp, RefreshCw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import {
  dailyPromptActionButtonClassName,
  dailyPromptCardClassName,
  dailyPromptContentClassName,
} from "@/components/journal/daily-prompt-styles";
import { Button } from "@/components/ui/button";
import type { DailyPromptState } from "@/lib/prompts/prompt-core";
import { previewNextPrompt } from "@/lib/prompts/prompt-core";

type DailyPromptCardProps = {
  entryId: string;
  initialPrompt: DailyPromptState;
  isToday: boolean;
};

type PromptActionBody =
  | { action: "skip" }
  | { action: "feedback"; feedback: "too_easy" | "too_hard" };

export function DailyPromptCard({
  entryId,
  initialPrompt,
  isToday,
}: DailyPromptCardProps) {
  const [activePrompt, setActivePrompt] = useState<DailyPromptState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const revertRef = useRef<DailyPromptState | null>(null);
  const latestPromptRef = useRef(initialPrompt);

  const prompt = activePrompt ?? initialPrompt;
  latestPromptRef.current = prompt;

  const runAction = useCallback(
    (body: PromptActionBody) => {
      const feedback = body.action === "feedback" ? body.feedback : undefined;
      const base = latestPromptRef.current;
      const nextPrompt = previewNextPrompt(base, feedback);

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
        setActionError("Couldn't save that prompt. Try again.");
      });
    },
    [entryId],
  );

  const showEasier = isToday && prompt.canVoteTooHard;
  const showHarder = isToday && prompt.canVoteTooEasy;

  return (
    <section
      className={dailyPromptCardClassName}
      aria-label="Today's writing prompt"
    >
      <div className={dailyPromptContentClassName}>
        <div className="flex w-full flex-col items-center text-center">
          <p className="mb-2 text-[12px] font-medium text-primary-foreground/75">
            Writing prompt
          </p>
          <p className="text-base leading-relaxed font-medium sm:text-[17px] sm:leading-snug">
            {prompt.text}
          </p>
          <span className="mt-2.5 inline-flex items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/15 px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-primary-foreground">
            {prompt.level}
          </span>
        </div>

        {isToday ? (
          <div className="flex w-full flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {showEasier ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className={dailyPromptActionButtonClassName}
                  onClick={() =>
                    runAction({ action: "feedback", feedback: "too_hard" })
                  }
                >
                  <ArrowDown aria-hidden />
                  Easier
                </Button>
              ) : null}
              {showHarder ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className={dailyPromptActionButtonClassName}
                  onClick={() =>
                    runAction({ action: "feedback", feedback: "too_easy" })
                  }
                >
                  <ArrowUp aria-hidden />
                  Harder
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={dailyPromptActionButtonClassName}
                aria-label="Refresh prompt"
                onClick={() => runAction({ action: "skip" })}
              >
                <RefreshCw aria-hidden />
                Refresh
              </Button>
            </div>
            {actionError ? (
              <p className="text-center text-[12px] text-primary-foreground/90">
                {actionError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

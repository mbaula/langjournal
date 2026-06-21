"use client";

import { RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DailyPromptState } from "@/lib/prompts/daily-prompt";
import { cn } from "@/lib/utils";

type DailyPromptBannerProps = {
  entryId: string;
  isToday: boolean;
  initialPrompt?: DailyPromptState | null;
};

const cardClassName =
  "mb-4 overflow-hidden rounded-xl border border-border/80 bg-primary shadow-sm";

const actionButtonClassName =
  "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground";

export function DailyPromptBanner({
  entryId,
  isToday,
  initialPrompt = null,
}: DailyPromptBannerProps) {
  const [prompt, setPrompt] = useState<DailyPromptState | null>(initialPrompt);
  const [loading, setLoading] = useState(initialPrompt == null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPrompt = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}/daily-prompt`);
      if (!res.ok) {
        setPrompt(null);
        return;
      }
      const data = (await res.json()) as { prompt: DailyPromptState };
      setPrompt(data.prompt);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    if (initialPrompt != null) {
      return;
    }
    void loadPrompt();
  }, [initialPrompt, loadPrompt]);

  const runAction = useCallback(
    async (body: { action: "skip" } | { action: "feedback"; feedback: "too_easy" | "too_hard" }) => {
      setActionPending(true);
      setActionError(null);
      try {
        const res = await fetch(`/api/entries/${entryId}/daily-prompt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setActionError("Couldn't update the prompt. Try again.");
          return;
        }
        const data = (await res.json()) as { prompt: DailyPromptState };
        setPrompt(data.prompt);
      } catch {
        setActionError("Couldn't update the prompt. Try again.");
      } finally {
        setActionPending(false);
      }
    },
    [entryId],
  );

  if (loading) {
    return (
      <div className={cardClassName} aria-hidden>
        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
          <div className="h-5 min-w-0 flex-1 animate-pulse bg-primary-foreground/20" />
          <div className="h-7 w-44 shrink-0 animate-pulse bg-primary-foreground/20 sm:ml-auto" />
        </div>
      </div>
    );
  }

  if (!prompt) {
    return null;
  }

  const showTooHard = isToday && prompt.canVoteTooHard;
  const showTooEasy = isToday && prompt.canVoteTooEasy;

  return (
    <section
      className={cn(cardClassName, "text-primary-foreground")}
      aria-label="Today's writing prompt"
    >
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
        <p
          className={cn(
            "min-w-0 flex-1 text-base leading-relaxed font-medium transition-opacity sm:text-[17px] sm:leading-snug",
            actionPending && "opacity-60",
          )}
        >
          {prompt.text}
        </p>

        {isToday ? (
          <div className="flex shrink-0 items-center justify-end gap-1.5 sm:ml-auto">
            {showTooHard ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={actionButtonClassName}
                disabled={actionPending}
                onClick={() =>
                  void runAction({ action: "feedback", feedback: "too_hard" })
                }
              >
                <ThumbsDown aria-hidden />
                Too hard
              </Button>
            ) : null}
            {showTooEasy ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={actionButtonClassName}
                disabled={actionPending}
                onClick={() =>
                  void runAction({ action: "feedback", feedback: "too_easy" })
                }
              >
                <ThumbsUp aria-hidden />
                Too easy
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="xs"
              className={cn(actionButtonClassName, actionPending && "opacity-80")}
              disabled={actionPending}
              aria-label="Refresh prompt"
              onClick={() => void runAction({ action: "skip" })}
            >
              <RefreshCw
                className={cn(actionPending && "animate-spin")}
                aria-hidden
              />
              Refresh
            </Button>
          </div>
        ) : null}
      </div>

      {actionError ? (
        <p className="border-t border-primary-foreground/15 px-5 py-2 text-[12px] text-primary-foreground/90">
          {actionError}
        </p>
      ) : null}
    </section>
  );
}

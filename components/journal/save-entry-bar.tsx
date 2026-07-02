"use client";

import { Button } from "@/components/ui/button";
import { wordCountLabel } from "@/lib/text/word-count";
import { cn } from "@/lib/utils";

const saveEntryButtonClassName =
  "h-11 rounded-full border border-border bg-white px-5 text-sm shadow-none hover:bg-white/90 dark:border-border dark:bg-card dark:hover:bg-card/90";

type SaveEntryBarProps = {
  canFinish: boolean;
  finishPending: boolean;
  successMessage: string | null;
  finishError: string | null;
  onFinish: () => void;
  wordCount?: number;
  className?: string;
};

export function SaveEntryBar({
  canFinish,
  finishPending,
  successMessage,
  finishError,
  onFinish,
  wordCount,
  className,
}: SaveEntryBarProps) {
  const showWordCount = wordCount !== undefined;
  const showActionRow = canFinish || showWordCount;

  if (!showActionRow && !successMessage && !finishError) {
    return null;
  }

  return (
    <div className={cn("flex w-full flex-col items-start gap-2", className)}>
      {successMessage ? (
        <p
          className="max-w-xs rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm leading-snug text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      {finishError ? (
        <p
          className="max-w-xs rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm leading-snug text-destructive"
          role="alert"
        >
          {finishError}
        </p>
      ) : null}
      {showActionRow ? (
        <div className="flex w-full items-center justify-between gap-4">
          {canFinish ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={finishPending}
              className={saveEntryButtonClassName}
              onClick={() => void onFinish()}
            >
              Save entry
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          {showWordCount ? (
            <p className="shrink-0 text-sm leading-none text-muted-foreground tabular-nums dark:text-foreground/80">
              {wordCountLabel(wordCount)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

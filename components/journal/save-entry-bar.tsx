"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("journal");
  const showWordCount = wordCount !== undefined;
  const showActionRow = canFinish || showWordCount || finishPending;
  const showStatus =
    !finishPending && (Boolean(successMessage) || Boolean(finishError));

  if (!showActionRow && !showStatus) {
    return null;
  }

  return (
    <div className={cn("flex w-full items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {canFinish || finishPending ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={finishPending}
              aria-busy={finishPending}
              className={saveEntryButtonClassName}
              onClick={() => void onFinish()}
            >
              {finishPending ? t("savingEntry") : t("saveEntry")}
            </Button>
            {finishPending ? (
              <Loader2
                className="size-4 shrink-0 animate-spin text-muted-foreground"
                strokeWidth={1.5}
                aria-hidden
              />
            ) : null}
          </>
        ) : null}
        {showStatus && successMessage ? (
          <p
            className="truncate text-sm whitespace-nowrap text-muted-foreground"
            role="status"
            aria-live="polite"
          >
            {successMessage}
          </p>
        ) : null}
        {showStatus && finishError ? (
          <p
            className="truncate text-sm whitespace-nowrap text-destructive"
            role="alert"
          >
            {finishError}
          </p>
        ) : null}
      </div>
      {showWordCount ? (
        <p className="shrink-0 text-sm leading-none text-muted-foreground tabular-nums dark:text-foreground/80">
          {wordCountLabel(wordCount)}
        </p>
      ) : null}
    </div>
  );
}

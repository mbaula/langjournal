"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const saveEntryButtonClassName =
  "h-10 rounded-full border border-border bg-white px-5 text-[13px] shadow-none hover:bg-white/90 dark:bg-background dark:hover:bg-background/90";

type SaveEntryBarProps = {
  canFinish: boolean;
  finishPending: boolean;
  successMessage: string | null;
  finishError: string | null;
  onFinish: () => void;
  className?: string;
};

export function SaveEntryBar({
  canFinish,
  finishPending,
  successMessage,
  finishError,
  onFinish,
  className,
}: SaveEntryBarProps) {
  if (!canFinish && !successMessage && !finishError) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky bottom-[max(30px,env(safe-area-inset-bottom))] z-30 mt-4 flex flex-col items-start gap-2 self-start",
        className,
      )}
    >
      {successMessage ? (
        <p
          className="max-w-xs rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] leading-snug text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      {finishError ? (
        <p
          className="max-w-xs rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-[13px] leading-snug text-destructive"
          role="alert"
        >
          {finishError}
        </p>
      ) : null}
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
      ) : null}
    </div>
  );
}

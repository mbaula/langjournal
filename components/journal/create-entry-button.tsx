"use client";

import { useCallback, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

function formatDefaultTitle(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

type CreateEntryButtonProps = {
  todayEntryId?: string | null;
  className?: string;
  floating?: boolean;
};

export function CreateEntryButton({
  todayEntryId,
  className,
  floating = false,
}: CreateEntryButtonProps) {
  const { switchEntry } = useEntry();
  const [pending, setPending] = useState(false);

  const openTodayEntry = useCallback(async () => {
    if (pending) return;
    
    // If we already know there's an entry for today, just switch to it
    if (todayEntryId) {
      switchEntry(todayEntryId);
      return;
    }
    
    // Otherwise, create a new entry
    setPending(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formatDefaultTitle() }),
      });
      const data = (await res.json()) as { entry?: { id: string } };
      if (data.entry?.id) {
        switchEntry(data.entry.id);
      }
    } finally {
      setPending(false);
    }
  }, [pending, switchEntry, todayEntryId]);

  const hasTodayEntry = Boolean(todayEntryId);

  return (
    <div
      className={cn(
        floating ? "fixed right-6 bottom-6 z-30" : "flex w-full max-w-sm flex-col gap-2",
        className,
      )}
    >
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={pending}
        onClick={() => void openTodayEntry()}
        className={cn(
          floating
            ? "h-10 rounded-full px-4 text-[13px] shadow-lg"
            : "h-9 w-full justify-center gap-2 text-[13px] shadow-sm",
        )}
      >
        <Plus className="size-4 shrink-0" strokeWidth={1.75} />
        {pending
          ? "Opening…"
          : hasTodayEntry
            ? "Open today's entry"
            : "New entry for today"}
      </Button>
    </div>
  );
}

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
};

export function CreateEntryButton({ todayEntryId }: CreateEntryButtonProps) {
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
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => void openTodayEntry()}
        className={cn(
          "h-9 w-full justify-start gap-2 border-border bg-transparent font-normal text-[13px] text-foreground shadow-none",
          "hover:bg-muted",
        )}
      >
        <Plus className="size-4 opacity-70" strokeWidth={1.75} />
        {pending
          ? "Opening…"
          : hasTodayEntry
            ? "Open today's entry"
            : "New entry for today"}
      </Button>
    </div>
  );
}

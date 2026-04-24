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

export function CreateEntryButton() {
  const { switchEntry } = useEntry();
  const [pending, setPending] = useState(false);

  const createEntry = useCallback(async () => {
    if (pending) return;
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
  }, [pending, switchEntry]);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => void createEntry()}
        className={cn(
          "h-9 w-full justify-start gap-2 border-border bg-transparent font-normal text-[13px] text-foreground shadow-none",
          "hover:bg-muted",
        )}
      >
        <Plus className="size-4 opacity-70" strokeWidth={1.75} />
        {pending ? "Opening…" : "New entry for today"}
      </Button>
    </div>
  );
}

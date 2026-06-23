"use client";

import { useCallback, useState } from "react";

import { Plus } from "lucide-react";

import { primaryPillButtonClassName } from "@/components/journal/field-styles";
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
  className?: string;
};

export function CreateEntryButton({ className }: CreateEntryButtonProps) {
  const { switchEntry } = useEntry();
  const [pending, setPending] = useState(false);

  const createNewEntry = useCallback(async () => {
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
    <Button
      type="button"
      variant="default"
      size="sm"
      disabled={pending}
      onClick={() => void createNewEntry()}
      className={cn(primaryPillButtonClassName, className)}
    >
      <Plus className="size-4 shrink-0" strokeWidth={1.5} />
      {pending ? "Creating…" : "New entry"}
    </Button>
  );
}

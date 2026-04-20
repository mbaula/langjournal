"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreateEntryButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTodayEntry() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const data = (await res.json()) as {
        error?: string;
        entry?: { id: string };
      };

      if (!res.ok || !data.entry?.id) {
        setError(data.error ?? "Could not create entry");
        return;
      }

      router.push(`/app/entry/${data.entry.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-9 w-full justify-start gap-2 border-border bg-transparent font-normal text-[13px] text-foreground shadow-none",
          "hover:bg-muted",
        )}
        disabled={pending}
        onClick={() => void createTodayEntry()}
      >
        <Plus className="size-4 opacity-70" strokeWidth={1.75} />
        {pending ? "Opening…" : "New entry for today"}
      </Button>
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

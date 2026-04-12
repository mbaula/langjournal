"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        size="lg"
        disabled={pending}
        onClick={() => void createTodayEntry()}
      >
        {pending ? "Opening…" : "Today’s entry"}
      </Button>
      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

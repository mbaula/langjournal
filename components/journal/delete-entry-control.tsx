"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Trash2 } from "lucide-react";

import { useEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

export async function deleteJournalEntryRequest(
  entryId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
    if (res.ok || res.status === 404) {
      return { ok: true };
    }
    let message = "Could not delete";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore non-JSON error bodies
    }
    return { ok: false, error: message };
  } catch {
    return { ok: false, error: "Something went wrong" };
  }
}

type DeleteEntryControlProps = {
  entryId: string;
  redirectTo?: string;
  className?: string;
};

export function DeleteEntryControl({
  entryId,
  redirectTo = "/app/journal",
  className,
}: DeleteEntryControlProps) {
  const router = useRouter();
  const { removeEntryFromCache } = useEntry();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function performDelete() {
    setPending(true);
    const result = await deleteJournalEntryRequest(entryId);
    if (result.ok) {
      removeEntryFromCache(entryId);
      router.push(redirectTo);
    }
    setPending(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <span className={cn("inline-flex items-center gap-2 text-[13px]", className)}>
        <span className="text-muted-foreground">Delete?</span>
        <button
          type="button"
          className="cursor-pointer rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          Cancel
        </button>
        <button
          type="button"
          className="cursor-pointer rounded px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          disabled={pending}
          onClick={() => void performDelete()}
        >
          {pending ? "…" : "Yes"}
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer inline-flex items-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
      aria-label="Delete entry"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" strokeWidth={1.75} />
    </button>
  );
}

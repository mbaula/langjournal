"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Trash2 } from "lucide-react";

import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { cn } from "@/lib/utils";

export type EntryRow = {
  id: string;
  title: string | null;
  entryDate: Date | string;
  updatedAt: Date | string;
};

function formatEntryDay(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EntryListRow({ entry }: { entry: EntryRow }) {
  const router = useRouter();
  const title = entry.title?.trim();
  const dateLabel = formatEntryDay(entry.entryDate);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function performDelete() {
    setPending(true);
    const result = await deleteJournalEntryRequest(entry.id);
    if (result.ok) {
      router.refresh();
    }
    setPending(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <li className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/50 px-2 py-2">
        <span className="truncate text-[13px] text-muted-foreground">
          Delete <span className="text-foreground">{title || dateLabel}</span>?
        </span>
        <div className="flex shrink-0 items-center gap-2 text-[13px]">
          <button
            type="button"
            className="cursor-pointer rounded px-2 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            disabled={pending}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded px-2 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            disabled={pending}
            onClick={() => void performDelete()}
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex min-w-0 items-center rounded-md transition-colors hover:bg-muted">
      <Link
        href={`/app/entry/${entry.id}`}
        className={cn(
          "flex min-w-0 flex-1 items-center truncate px-2 py-2 text-[14px]",
          "text-foreground",
        )}
      >
        {title ? (
          <>
            <span className="font-medium">{title}</span>
            <span className="text-muted-foreground"> · {dateLabel}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{dateLabel}</span>
        )}
      </Link>
      <button
        type="button"
        className="mr-1.5 cursor-pointer rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-background hover:text-foreground group-hover:opacity-100"
        aria-label="Delete entry"
        onClick={(e) => {
          e.preventDefault();
          setConfirming(true);
        }}
      >
        <Trash2 className="size-3.5" strokeWidth={1.75} />
      </button>
    </li>
  );
}

export function EntryList({ entries }: { entries: EntryRow[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">No entries yet.</p>
    );
  }

  return (
    <ul className="flex w-full flex-col">
      {entries.map((entry) => (
        <EntryListRow key={entry.id} entry={entry} />
      ))}
    </ul>
  );
}

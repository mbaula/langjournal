import Link from "next/link";

import { cn } from "@/lib/utils";

type EntryRow = {
  id: string;
  title: string | null;
  entryDate: Date;
  updatedAt: Date;
};

function formatEntryDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EntryList({ entries }: { entries: EntryRow[] }) {
  if (entries.length === 0) {
    return (
      <p className="max-w-md text-center text-sm text-muted-foreground">
        No entries yet.
      </p>
    );
  }

  return (
    <ul className="mx-auto flex w-full max-w-xl flex-col gap-2.5">
      {entries.map((entry) => {
        const title = entry.title?.trim();
        const dateLabel = formatEntryDay(entry.entryDate);

        return (
          <li key={entry.id}>
            <Link
              href={`/app/entry/${entry.id}`}
              className={cn(
                "block min-w-0 truncate rounded-2xl border border-border/70 bg-background/90 px-4 py-3.5 text-sm shadow-sm backdrop-blur-sm transition-colors",
                "hover:border-border hover:bg-muted/30",
              )}
            >
              {title ? (
                <>
                  <span className="font-medium text-foreground">{title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    : {dateLabel}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {dateLabel}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

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
      <p className="text-[13px] text-muted-foreground">No entries yet.</p>
    );
  }

  return (
    <ul className="flex w-full flex-col">
      {entries.map((entry) => {
        const title = entry.title?.trim();
        const dateLabel = formatEntryDay(entry.entryDate);

        return (
          <li key={entry.id}>
            <Link
              href={`/app/entry/${entry.id}`}
              className={cn(
                "block min-w-0 truncate rounded-md px-2 py-2 text-[14px] transition-colors",
                "text-foreground hover:bg-muted",
              )}
            >
              {title ? (
                <>
                  <span className="font-medium">{title}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {dateLabel}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">{dateLabel}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

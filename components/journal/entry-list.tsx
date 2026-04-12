import Link from "next/link";

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
      <p className="text-center text-sm text-muted-foreground">
        No entries yet. Start today&apos;s entry below.
      </p>
    );
  }

  return (
    <ul className="mx-auto w-full max-w-xl space-y-2">
      {entries.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/app/entry/${entry.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm shadow-sm transition-colors hover:bg-muted/50"
          >
            <span className="font-medium">
              {entry.title?.trim() || formatEntryDay(entry.entryDate)}
            </span>
            <span className="text-muted-foreground">
              {formatEntryDay(entry.entryDate)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

import {
  EntryListItem,
  type EntryListItemProps,
} from "@/components/journal/entry-list-item";

export type EntryRow = {
  id: string;
  title: string | null;
  entryDate: Date | string;
  updatedAt: Date | string;
};

type EntryListProps = {
  entries: EntryRow[];
  onRenameTitle?: EntryListItemProps["onRenameTitle"];
  onDelete?: EntryListItemProps["onDelete"];
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

export function EntryList({
  entries,
  onRenameTitle,
  onDelete,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">No entries yet.</p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-0.5">
      {entries.map((entry) => (
        <EntryListItem
          key={entry.id}
          entryId={entry.id}
          href={`/app/entry/${entry.id}`}
          title={entry.title}
          dateLabel={formatEntryDay(entry.entryDate)}
          onRenameTitle={onRenameTitle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

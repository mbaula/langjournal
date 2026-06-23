import {
  JournalEntryCard,
  type JournalEntryCardProps,
} from "@/components/journal/journal-entry-card";
import { getLanguageDisplayName } from "@/lib/languages/display-name";

export type EntryRow = {
  id: string;
  title: string | null;
  entryDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  body: string | null;
  translations: unknown;
  flashcardCount?: number;
};

export function formatFlashcardLabel(count: number): string {
  return count === 1 ? "1 flashcard" : `${count} flashcards`;
}

export function formatEntrySubtitle(
  dateLabel: string,
  options?: {
    languageLabel?: string | null;
    flashcardCount?: number;
  },
): string {
  const parts = [dateLabel];

  if (options?.languageLabel) {
    parts.push(options.languageLabel);
  }

  if (options?.flashcardCount && options.flashcardCount > 0) {
    parts.push(formatFlashcardLabel(options.flashcardCount));
  }

  return parts.join(" | ");
}

type EntryListProps = {
  entries: EntryRow[];
  targetLanguage?: string;
  onRenameTitle?: JournalEntryCardProps["onRenameTitle"];
  onDelete?: JournalEntryCardProps["onDelete"];
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

export function pastEntryAnchorId(entryId: string) {
  return `past-entry-${entryId}`;
}

export function countEntryTranslations(translations: unknown): number {
  if (!Array.isArray(translations)) {
    return 0;
  }

  return translations.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }
    const record = item as { id?: unknown };
    if (typeof record.id === "string" && record.id.startsWith("opt-")) {
      return false;
    }
    return "id" in item && "sourceText" in item && "translatedText" in item;
  }).length;
}

export function EntryList({
  entries,
  targetLanguage,
  onRenameTitle,
  onDelete,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">No entries yet.</p>
    );
  }

  const languageLabel = targetLanguage
    ? getLanguageDisplayName(targetLanguage)
    : null;

  return (
    <ul className="flex w-full flex-col gap-10">
      {entries.map((entry) => (
        <li
          key={entry.id}
          id={pastEntryAnchorId(entry.id)}
          className="scroll-mt-28 list-none"
        >
          <JournalEntryCard
            entryId={entry.id}
            href={`/app/entry/${entry.id}`}
            title={entry.title}
            dateLabel={formatEntryDay(entry.entryDate)}
            languageLabel={languageLabel}
            flashcardCount={entry.flashcardCount}
            body={entry.body}
            translations={entry.translations}
            onRenameTitle={onRenameTitle}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

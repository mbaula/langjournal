import {
  JournalEntryCard,
  type JournalEntryCardProps,
} from "@/components/journal/journal-entry-card";
import { PastEntryEditor } from "@/components/journal/past-entry-editor";
import {
  PAST_ENTRY_EXPAND_MS,
  PastEntryExpandPanel,
} from "@/components/journal/past-entry-expand-panel";
import { getLanguageDisplayName } from "@/lib/languages/display-name";
import type { TranslateTrigger } from "@/components/journal/journal-editor";
import { cn } from "@/lib/utils";

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
  sourceLanguage?: string;
  translateTrigger?: TranslateTrigger;
  onLanguagesSaved?: (source: string, target: string) => void;
  editingEntryId?: string | null;
  onEditEntry?: (entryId: string) => void;
  onEntrySaved?: (entry: EntryRow) => void;
  onEntryDeleted?: (entryId: string) => void;
  onRenameTitle?: JournalEntryCardProps["onRenameTitle"];
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
  sourceLanguage,
  translateTrigger,
  onLanguagesSaved,
  editingEntryId,
  onEditEntry,
  onEntrySaved,
  onEntryDeleted,
  onRenameTitle,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No entries yet.</p>
    );
  }

  const languageLabel = targetLanguage
    ? getLanguageDisplayName(targetLanguage)
    : null;

  return (
    <ul className="flex w-full flex-col gap-10">
      {entries.map((entry) => {
        const isExpanded = editingEntryId === entry.id;

        return (
          <li
            key={entry.id}
            id={pastEntryAnchorId(entry.id)}
            className="group/entry scroll-mt-28 list-none w-full"
          >
            <div className="grid">
              <div
                className={cn(
                  "col-start-1 row-start-1 transition-[opacity,transform] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  isExpanded ? "pointer-events-none opacity-0" : "opacity-100",
                )}
                style={{ transitionDuration: `${PAST_ENTRY_EXPAND_MS}ms` }}
                aria-hidden={isExpanded}
              >
                <JournalEntryCard
                  entryId={entry.id}
                  title={entry.title}
                  dateLabel={formatEntryDay(entry.entryDate)}
                  languageLabel={languageLabel}
                  flashcardCount={entry.flashcardCount}
                  body={entry.body}
                  translations={entry.translations}
                  onOpen={onEditEntry ? () => onEditEntry(entry.id) : undefined}
                  onRenameTitle={onRenameTitle}
                  onDeleted={onEntryDeleted}
                />
              </div>

              <div className="col-start-1 row-start-1">
                {sourceLanguage && onEntrySaved ? (
                  <PastEntryExpandPanel open={isExpanded}>
                    <PastEntryEditor
                      entry={entry}
                      sourceLanguage={sourceLanguage}
                      targetLanguage={targetLanguage ?? sourceLanguage}
                      translateTrigger={translateTrigger}
                      onLanguagesSaved={onLanguagesSaved}
                      onSaved={onEntrySaved}
                      onDeleted={onEntryDeleted}
                    />
                  </PastEntryExpandPanel>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

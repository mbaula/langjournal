"use client";

import Link from "next/link";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { journalTranslationHighlightClassName } from "@/components/journal/field-styles";
import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import type { InlineTranslation } from "@/lib/entries/translate";
import { cn } from "@/lib/utils";

function coalesceTranslations(raw: unknown): InlineTranslation[] {
  if (!Array.isArray(raw)) return [];
  const out: InlineTranslation[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "sourceText" in item &&
      "translatedText" in item
    ) {
      out.push(item as InlineTranslation);
    }
  }
  return out;
}

export type JournalEntryCardProps = {
  entryId: string;
  href: string;
  title: string | null;
  dateLabel: string;
  body: string | null;
  translations: unknown;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function JournalEntryCard({
  entryId,
  href,
  title,
  dateLabel,
  body,
  translations,
  onRenameTitle,
  onDelete,
}: JournalEntryCardProps) {
  const trimmedTitle = title?.trim();
  const displayTitle = trimmedTitle || dateLabel;
  const subtitle = trimmedTitle ? dateLabel : null;
  const text = body ?? "";
  const lines = text.split("\n");
  const segsList = coalesceTranslations(translations);
  const isEmptyBody =
    lines.length === 0 || (lines.length === 1 && !lines[0].trim());

  return (
    <li className="list-none">
      <div className="group/row flex gap-2 sm:gap-3">
        <Link
          href={href}
          className={cn(
            "min-w-0 flex-1 rounded-lg p-4 outline-none ring-offset-background transition-colors",
            "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={
            subtitle
              ? `Open entry to edit: ${displayTitle}, ${subtitle}`
              : `Open entry to edit: ${displayTitle}`
          }
        >
          <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
            {displayTitle}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          ) : null}
          <hr className="my-4 border-border" />
          <div className="flex flex-col gap-0">
            {isEmptyBody ? (
              <p className="text-[15px] leading-[1.65] text-muted-foreground/80">
                No text yet — open this entry to write.
              </p>
            ) : (
              lines.map((line, idx) => {
                const segs = segmentTranslatedLine(line, segsList);
                return (
                  <p
                    key={idx}
                    className="min-h-[1.65em] whitespace-pre-wrap text-[15px] leading-[1.65] text-foreground"
                  >
                    {segs.map((seg, si) =>
                      seg.translation ? (
                        <span
                          key={si}
                          title={seg.translation.sourceText}
                          className={cn(
                            "cursor-default",
                            journalTranslationHighlightClassName,
                          )}
                        >
                          {seg.text}
                        </span>
                      ) : (
                        <span key={si}>{seg.text}</span>
                      ),
                    )}
                  </p>
                );
              })
            )}
          </div>
        </Link>
        <div className="shrink-0 pt-2">
          <EntryActionsMenu
            entryId={entryId}
            onRenameTitle={onRenameTitle}
            onDelete={onDelete}
            triggerClassName="text-muted-foreground"
          />
        </div>
      </div>
    </li>
  );
}

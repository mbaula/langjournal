"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { FlashcardLibraryGrid } from "@/components/flashcards/flashcard-library-grid";
import {
  type FlashcardEntryGroup,
} from "@/lib/flashcards/library-sort";
import type { FlashcardRecord } from "@/lib/flashcards/types";
import { useFlashcardGroupLabels } from "@/lib/i18n/hooks";
import { cn } from "@/lib/utils";

type FlashcardLibraryEntrySectionsProps = {
  groups: readonly FlashcardEntryGroup[];
  getItemKey: (item: FlashcardRecord) => string;
  renderItem: (item: FlashcardRecord) => ReactNode;
  className?: string;
};

function groupLabel(
  group: FlashcardEntryGroup,
  labels: ReturnType<typeof useFlashcardGroupLabels>,
): string {
  if (group.entryTitle?.trim()) return group.entryTitle.trim();
  if (group.entryId) return labels.untitledEntry;
  return labels.noLinkedEntry;
}

export function FlashcardLibraryEntrySections({
  groups,
  getItemKey,
  renderItem,
  className,
}: FlashcardLibraryEntrySectionsProps) {
  const t = useTranslations("flashcards.groups");
  const groupLabels = useFlashcardGroupLabels();

  return (
    <div className={cn("flex flex-col gap-10 border-t border-border pt-8", className)}>
      {groups.map((group, index) => {
        const label = groupLabel(group, groupLabels);
        const itemCount = group.cards.length;

        return (
          <section
            key={group.key}
            aria-labelledby={`flashcard-entry-group-heading-${group.key}`}
            className={cn(
              "flex min-w-0 flex-col gap-4",
              index > 0 && "border-t border-border pt-10",
            )}
          >
            <div className="min-w-0 space-y-1">
              <h2
                id={`flashcard-entry-group-heading-${group.key}`}
                className="truncate text-base font-semibold tracking-tight text-foreground"
                title={label}
              >
                {label}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("flashcardCount", { count: itemCount })}
              </p>
            </div>

            <FlashcardLibraryGrid
              items={group.cards}
              getItemKey={getItemKey}
              renderItem={renderItem}
            />
          </section>
        );
      })}
    </div>
  );
}

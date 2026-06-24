"use client";

import type { ReactNode } from "react";

import { FlashcardLibraryGrid } from "@/components/flashcards/flashcard-library-grid";
import {
  entryGroupLabel,
  type FlashcardEntryGroup,
} from "@/lib/flashcards/library-sort";
import type { FlashcardRecord } from "@/lib/flashcards/types";
import { cn } from "@/lib/utils";

type FlashcardLibraryEntrySectionsProps = {
  groups: readonly FlashcardEntryGroup[];
  getItemKey: (item: FlashcardRecord) => string;
  renderItem: (item: FlashcardRecord) => ReactNode;
  className?: string;
};

export function FlashcardLibraryEntrySections({
  groups,
  getItemKey,
  renderItem,
  className,
}: FlashcardLibraryEntrySectionsProps) {
  return (
    <div className={cn("flex flex-col gap-10 border-t border-border pt-8", className)}>
      {groups.map((group, index) => {
        const label = entryGroupLabel(group);
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
                {itemCount} {itemCount === 1 ? "flashcard" : "flashcards"}
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

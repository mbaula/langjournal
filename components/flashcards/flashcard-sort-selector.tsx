"use client";

import { FlashcardToolbarSelect } from "@/components/flashcards/flashcard-toolbar-select";
import {
  FLASHCARD_LIBRARY_SORT_LABELS,
  FLASHCARD_LIBRARY_SORT_OPTIONS,
  type FlashcardLibrarySort,
} from "@/lib/flashcards/library-sort";

type FlashcardSortSelectorProps = {
  value: FlashcardLibrarySort;
  onChange: (value: FlashcardLibrarySort) => void;
  className?: string;
};

const SORT_OPTIONS = FLASHCARD_LIBRARY_SORT_OPTIONS.map((value) => ({
  value,
  label: FLASHCARD_LIBRARY_SORT_LABELS[value],
}));

export function FlashcardSortSelector({
  value,
  onChange,
  className,
}: FlashcardSortSelectorProps) {
  return (
    <FlashcardToolbarSelect
      value={value}
      onChange={onChange}
      options={SORT_OPTIONS}
      ariaLabel="Sort flashcards"
      className={className}
    />
  );
}

"use client";

import { FlashcardToolbarSelect } from "@/components/flashcards/flashcard-toolbar-select";
import {
  FLASHCARD_LIBRARY_SORT_OPTIONS,
  type FlashcardLibrarySort,
} from "@/lib/flashcards/library-sort";
import { useFlashcardSortLabels } from "@/lib/i18n/hooks";
import { useTranslations } from "next-intl";

type FlashcardSortSelectorProps = {
  value: FlashcardLibrarySort;
  onChange: (value: FlashcardLibrarySort) => void;
  className?: string;
};

export function FlashcardSortSelector({
  value,
  onChange,
  className,
}: FlashcardSortSelectorProps) {
  const t = useTranslations("flashcards.sort");
  const sortLabels = useFlashcardSortLabels();
  const sortOptions = FLASHCARD_LIBRARY_SORT_OPTIONS.map((option) => ({
    value: option,
    label: sortLabels[option],
  }));

  return (
    <FlashcardToolbarSelect
      value={value}
      onChange={onChange}
      options={sortOptions}
      ariaLabel={t("ariaLabel")}
      className={className}
    />
  );
}

"use client";

import { useTranslations } from "next-intl";

import type {
  OnboardingAgeRange,
  OnboardingLanguageLevel,
} from "@/lib/onboarding/constants";
import {
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/constants";
import type { FlashcardLibrarySort } from "@/lib/flashcards/library-sort";
import { FLASHCARD_LIBRARY_SORT_OPTIONS } from "@/lib/flashcards/library-sort";

export function useOnboardingLabels() {
  const t = useTranslations("onboarding");

  const languageLevelLabels = Object.fromEntries(
    ONBOARDING_LANGUAGE_LEVELS.map((level) => [
      level,
      t(`levels.${level}`),
    ]),
  ) as Record<OnboardingLanguageLevel, string>;

  const ageRangeLabels = Object.fromEntries(
    ONBOARDING_AGE_RANGES.map((range) => [range, t(`ageRanges.${range}`)]),
  ) as Record<OnboardingAgeRange, string>;

  const levelDescriptions = Object.fromEntries(
    ONBOARDING_LANGUAGE_LEVELS.map((level) => [
      level,
      t(`levelDescriptions.${level}`),
    ]),
  ) as Record<OnboardingLanguageLevel, string>;

  return { languageLevelLabels, ageRangeLabels, levelDescriptions };
}

export function useFlashcardSortLabels() {
  const t = useTranslations("flashcards.sort");

  return Object.fromEntries(
    FLASHCARD_LIBRARY_SORT_OPTIONS.map((sort) => [sort, t(sort)]),
  ) as Record<FlashcardLibrarySort, string>;
}

export function useFlashcardGroupLabels() {
  const t = useTranslations("flashcards.groups");
  return {
    untitledEntry: t("untitledEntry"),
    noLinkedEntry: t("noLinkedEntry"),
  };
}

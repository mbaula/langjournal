import type {
  OnboardingAgeRange,
  OnboardingLanguageLevel,
} from "@/lib/onboarding/constants";
import {
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/constants";

export const AGE_RANGE_LABELS: Record<OnboardingAgeRange, string> = {
  under_18: "Under 18",
  "18_24": "18-24",
  "25_34": "25-34",
  "35_64": "35-64",
  "65_plus": "65+",
  prefer_not_to_say: "Prefer not to say",
};

export const LANGUAGE_LEVEL_LABELS: Record<OnboardingLanguageLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  proficient: "Proficient",
};

export { ONBOARDING_AGE_RANGES, ONBOARDING_LANGUAGE_LEVELS };

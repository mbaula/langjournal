export const ONBOARDING_AGE_RANGES = [
  "under_18",
  "18_24",
  "25_34",
  "35_64",
  "65_plus",
  "prefer_not_to_say",
] as const;

export const ONBOARDING_LANGUAGE_LEVELS = [
  "beginner",
  "intermediate",
  "proficient",
] as const;

export type OnboardingAgeRange = (typeof ONBOARDING_AGE_RANGES)[number];
export type OnboardingLanguageLevel = (typeof ONBOARDING_LANGUAGE_LEVELS)[number];

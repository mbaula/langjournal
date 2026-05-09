import { CefrLevel } from "@prisma/client";

import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";

/**
 * Maps user-declared tier (onboarding) to initial hidden CEFR anchor.
 * The third onboarding value is stored as `proficient` (UI: Proficient); it uses the same
 * mapping as an "advanced" top tier (B2 single anchor, B2–C1 prompt band).
 */
export function mapDeclaredLevelToCefr(level: OnboardingLanguageLevel): CefrLevel {
  switch (level) {
    case "beginner":
      return CefrLevel.A1;
    case "intermediate":
      return CefrLevel.B1;
    case "proficient":
      return CefrLevel.B2;
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

/** Bands used when filtering prompts by declared tier (groundwork only). */
export function getPromptCefrBandsForDeclaredLevel(
  level: OnboardingLanguageLevel,
): readonly [CefrLevel, CefrLevel] {
  switch (level) {
    case "beginner":
      return [CefrLevel.A1, CefrLevel.A2];
    case "intermediate":
      return [CefrLevel.B1, CefrLevel.B2];
    case "proficient":
      return [CefrLevel.B2, CefrLevel.C1];
    default: {
      const _exhaustive: never = level;
      return _exhaustive;
    }
  }
}

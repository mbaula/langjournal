import { z } from "zod";

import {
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/constants";

const nameRegex = /^[A-Za-z][A-Za-z\s'-]*$/;

const languageCode = z
  .string()
  .trim()
  .min(2, "Language code too short")
  .max(20, "Language code too long")
  .regex(/^[\w-]+$/, "Invalid language code");

const userLanguageEntry = z.object({
  languageCode,
  level: z.enum(ONBOARDING_LANGUAGE_LEVELS),
});

export const onboardingPayloadSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .max(50, "Name must be 50 characters or fewer")
      .regex(nameRegex, "Use letters, spaces, apostrophes, or hyphens only")
      .optional()
      .or(z.literal("")),
    ageRange: z.enum(ONBOARDING_AGE_RANGES).optional(),
    languages: z
      .array(userLanguageEntry)
      .min(1, "At least one language is required"),
  })
  .strict();

export type OnboardingPayload = z.infer<typeof onboardingPayloadSchema>;

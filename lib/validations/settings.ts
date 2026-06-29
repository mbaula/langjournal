import { z } from "zod";

import { ONBOARDING_LANGUAGE_LEVELS } from "@/lib/onboarding/constants";
import { displayNameSchema } from "@/lib/validations/display-name";

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

/** Profile fields editable from settings — age range is set during onboarding only. */
export const settingsProfilePayloadSchema = z
  .object({
    displayName: displayNameSchema,
    languages: z
      .array(userLanguageEntry)
      .min(1, "At least one language is required"),
  })
  .strict();

export type SettingsProfilePayload = z.infer<typeof settingsProfilePayloadSchema>;

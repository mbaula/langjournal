import { z } from "zod";

import { UI_LOCALE_CODES } from "@/lib/i18n/locales";

const langCode = z
  .string()
  .trim()
  .min(2, "Code too short")
  .max(20, "Code too long")
  .regex(/^[\w-]+$/, "Invalid language code");

export const patchLanguageProfileSchema = z
  .object({
    nativeLanguage: langCode,
    targetLanguage: langCode,
  })
  .strict()
  .refine((d) => d.nativeLanguage !== d.targetLanguage, {
    message: "Native and target must be different",
    path: ["targetLanguage"],
  });

export const patchUiLocaleSchema = z
  .object({
    uiLocale: z.enum(UI_LOCALE_CODES),
  })
  .strict();

export type PatchLanguageProfileBody = z.infer<
  typeof patchLanguageProfileSchema
>;

export type PatchUiLocaleBody = z.infer<typeof patchUiLocaleSchema>;

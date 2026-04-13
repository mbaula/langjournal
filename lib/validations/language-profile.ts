import { z } from "zod";

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

export type PatchLanguageProfileBody = z.infer<
  typeof patchLanguageProfileSchema
>;

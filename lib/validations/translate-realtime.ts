import { z } from "zod";

const langCode = z
  .string()
  .trim()
  .min(2, "Code too short")
  .max(20, "Code too long")
  .regex(/^[\w-]+$/, "Invalid language code");

export const realtimeTranslateSchema = z
  .object({
    text: z.string().trim().min(1, "text is required").max(3000),
    source: langCode,
    target: langCode,
  })
  .strict()
  .refine((d) => d.source !== d.target, {
    message: "Source and target must be different",
    path: ["target"],
  });

export type RealtimeTranslateBody = z.infer<typeof realtimeTranslateSchema>;

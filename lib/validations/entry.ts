import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional();

const entryLanguageCode = z
  .string()
  .trim()
  .min(2, "Code too short")
  .max(20, "Code too long")
  .regex(/^[\w-]+$/, "Invalid language code");

export const createJournalEntryBodySchema = z
  .object({
    entryDate: isoDate,
    title: z.string().max(500).optional().nullable(),
  })
  .strict();

export type CreateJournalEntryBody = z.infer<
  typeof createJournalEntryBodySchema
>;

export function parseEntryDate(input?: string | null): Date {
  if (!input) {
    return new Date();
  }
  const [y, m, d] = input.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export const patchJournalEntryBodySchema = z
  .object({
    title: z.string().max(500).optional(),
    body: z.string().max(200_000).optional(),
    translations: z
      .array(
        z.object({
          id: z.string(),
          sourceText: z.string(),
          translatedText: z.string(),
          spans: z
            .array(
              z.object({
                start: z.number().int().min(0),
                end: z.number().int().min(0),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
  })
  .strict()
  .refine(
    (d) =>
      d.title !== undefined ||
      d.body !== undefined ||
      d.translations !== undefined,
    {
      message: "Provide title, body, or translations",
    },
  );

const inlineTranslationSchema = z.object({
  id: z.string(),
  sourceText: z.string(),
  translatedText: z.string(),
  spans: z
    .array(
      z.object({
        start: z.number().int().min(0),
        end: z.number().int().min(0),
      }),
    )
    .optional(),
});

export const finishJournalEntryBodySchema = z
  .object({
    title: z.string().max(500).optional(),
    body: z.string().max(200_000).optional(),
    translations: z.array(inlineTranslationSchema).optional(),
    sourceLanguage: entryLanguageCode.optional(),
    targetLanguage: entryLanguageCode.optional(),
  })
  .strict();

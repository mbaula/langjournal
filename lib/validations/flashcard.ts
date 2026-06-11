import { z } from "zod";

export const flashcardProficiencySchema = z.enum([
  "NEW",
  "LEARNING",
  "FAMILIAR",
  "MASTERED",
]);

export const patchFlashcardBodySchema = z
  .object({
    word: z.string().trim().min(1).max(500).optional(),
    translation: z.string().trim().min(1).max(500).optional(),
    exampleSentence: z.string().max(5000).nullable().optional(),
    proficiency: flashcardProficiencySchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.word !== undefined ||
      data.translation !== undefined ||
      data.exampleSentence !== undefined ||
      data.proficiency !== undefined,
    { message: "Provide at least one field to update" },
  );

export const practiceResponseSchema = z.enum([
  "still_learning",
  "almost",
  "got_it",
]);

export const completePracticeSessionSchema = z
  .object({
    reviews: z.array(
      z.object({
        flashcardId: z.string().uuid(),
        response: practiceResponseSchema,
      }),
    ),
  })
  .strict();

export const flashcardListQuerySchema = z.object({
  q: z.string().optional(),
  proficiency: flashcardProficiencySchema.optional(),
  language: z.string().optional(),
  addedAfter: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  addedBefore: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional();

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

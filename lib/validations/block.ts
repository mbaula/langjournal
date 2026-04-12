import { z } from "zod";

export const textBlockBodySchema = z
  .object({
    text: z.string().max(100_000),
  })
  .strict();

/** POST /api/entries/[id]/blocks — create non-empty text block */
export const createTextBlockBodySchema = textBlockBodySchema;

/** PATCH /api/blocks/[id] — update text (may be empty after trim) */
export const updateTextBlockBodySchema = textBlockBodySchema;

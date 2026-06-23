import { z } from "zod";

export const promptTargetSchema = z.object({
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  index: z.number().int().min(0),
});

export const dailyPromptActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("skip"), target: promptTargetSchema }),
  z.object({
    action: z.literal("feedback"),
    feedback: z.enum(["too_easy", "too_hard"]),
    target: promptTargetSchema,
  }),
]);

export type DailyPromptAction = z.infer<typeof dailyPromptActionSchema>;

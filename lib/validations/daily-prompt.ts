import { z } from "zod";

export const dailyPromptActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("skip") }),
  z.object({
    action: z.literal("feedback"),
    feedback: z.enum(["too_easy", "too_hard"]),
  }),
]);

export type DailyPromptAction = z.infer<typeof dailyPromptActionSchema>;

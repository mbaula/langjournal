import { DailyPromptCard } from "@/components/journal/daily-prompt-card";
import { getDailyPromptForEntry } from "@/lib/prompts/daily-prompt";

type DailyPromptSectionProps = {
  entryId: string;
  userId: string;
  isToday: boolean;
};

export async function DailyPromptSection({
  entryId,
  userId,
  isToday,
}: DailyPromptSectionProps) {
  const prompt = await getDailyPromptForEntry(userId, entryId);

  if (!prompt) {
    return null;
  }

  return (
    <DailyPromptCard
      entryId={entryId}
      initialPrompt={prompt}
      isToday={isToday}
    />
  );
}

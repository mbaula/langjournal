export type SeedPrompt = {
  languageCode?: string;
  mode: "FUN" | "ACADEMIC";
  minCefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  maxCefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  topicTags: string[];
  safetyTags: string[];
  requiredWords: string[];
  promptText: string;
  source?: "CURATED" | "LLM_GENERATED";
  status?: "ACTIVE" | "DISABLED" | "NEEDS_REVIEW";
};

export const prompts: SeedPrompt[] = [
  {
    languageCode: "any",
    mode: "FUN",
    minCefr: "A1",
    maxCefr: "A2",
    topicTags: ["daily_life", "food"],
    safetyTags: [],
    requiredWords: [],
    promptText:
      "Write about something you ate today. Describe the taste, smell, and whether you liked it.",
    source: "CURATED",
    status: "ACTIVE",
  },
  {
    languageCode: "any",
    mode: "ACADEMIC",
    minCefr: "B1",
    maxCefr: "B2",
    topicTags: ["opinion", "school"],
    safetyTags: [],
    requiredWords: [],
    promptText:
      "Explain whether students learn better from textbooks, videos, or hands-on projects. Give reasons for your opinion.",
    source: "CURATED",
    status: "ACTIVE",
  },
  {
    languageCode: "any",
    mode: "FUN",
    minCefr: "B2",
    maxCefr: "C1",
    topicTags: ["absurd", "story"],
    safetyTags: [],
    requiredWords: [],
    promptText:
      "Write a journal entry from the perspective of someone who accidentally became mayor of a town run entirely by cats.",
    source: "CURATED",
    status: "ACTIVE",
  },
];


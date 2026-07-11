import type { UiLocale } from "@/lib/i18n/locales";

import esPrompts from "@/messages/prompts/es.json";
import viPrompts from "@/messages/prompts/vi.json";
import zhCNPrompts from "@/messages/prompts/zh-CN.json";
import {
  PROMPTS_BY_LEVEL,
  type PromptCefrLevel,
} from "@/lib/prompts/prompts";

type PromptMessages = Record<PromptCefrLevel, readonly string[]>;

const PROMPT_MESSAGES: Partial<Record<UiLocale, PromptMessages>> = {
  vi: viPrompts as PromptMessages,
  "zh-CN": zhCNPrompts as PromptMessages,
  es: esPrompts as PromptMessages,
};

export function getLocalizedPromptText(
  level: PromptCefrLevel,
  index: number,
  locale: UiLocale = "en",
): string {
  const english = PROMPTS_BY_LEVEL[level];
  if (index < 0 || index >= english.length) {
    throw new RangeError(`Prompt index ${index} out of range for level ${level}`);
  }

  if (locale === "en") {
    return english[index]!;
  }

  const localized = PROMPT_MESSAGES[locale]?.[level]?.[index];
  return localized ?? english[index]!;
}

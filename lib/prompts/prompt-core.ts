import type { CefrLevel } from "@prisma/client";

import {
  bumpCefrLevel,
  canBumpCefrLevel,
  canLowerCefrLevel,
  lowerCefrLevel,
} from "@/lib/prompts/cefr";
import {
  getPromptCount,
  getPromptText,
  type PromptCefrLevel,
} from "@/lib/prompts/prompts";

/** @deprecated Streak counters are kept for compatibility; levels change immediately. */
export const FEEDBACK_STREAK_THRESHOLD = 1;

export type DailyPromptState = {
  text: string;
  level: CefrLevel;
  index: number;
  canVoteTooEasy: boolean;
  canVoteTooHard: boolean;
  tooEasyStreak: number;
  tooHardStreak: number;
};

export type PromptFeedback = "too_easy" | "too_hard";

export function pickRandomUnseenIndex(
  level: PromptCefrLevel,
  seen: number[],
  excludeIndex?: number,
): { index: number; resetSeen: boolean } {
  const total = getPromptCount(level);
  if (total <= 1) {
    return { index: 0, resetSeen: false };
  }

  const seenSet = new Set(seen);
  if (excludeIndex != null) {
    seenSet.add(excludeIndex);
  }

  const unseen = Array.from({ length: total }, (_, i) => i).filter(
    (i) => !seenSet.has(i),
  );

  if (unseen.length === 0) {
    const candidates = Array.from({ length: total }, (_, i) => i).filter(
      (i) => i !== excludeIndex,
    );
    const index =
      candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
    return { index, resetSeen: true };
  }

  const index = unseen[Math.floor(Math.random() * unseen.length)]!;
  return { index, resetSeen: false };
}

export function buildPromptState(
  level: CefrLevel,
  index: number,
  tooEasyStreak: number,
  tooHardStreak: number,
): DailyPromptState {
  return {
    text: getPromptText(level as PromptCefrLevel, index),
    level,
    index,
    canVoteTooEasy: canBumpCefrLevel(level),
    canVoteTooHard: canLowerCefrLevel(level),
    tooEasyStreak,
    tooHardStreak,
  };
}

/** Instant client-side preview while the API persists the change. */
export function previewNextPrompt(
  current: DailyPromptState,
  feedback?: PromptFeedback,
): DailyPromptState {
  let nextLevel = current.level;
  let tooEasyStreak = current.tooEasyStreak;
  let tooHardStreak = current.tooHardStreak;

  if (feedback === "too_easy" && canBumpCefrLevel(current.level)) {
    nextLevel = bumpCefrLevel(current.level);
    tooEasyStreak = 0;
    tooHardStreak = 0;
  } else if (feedback === "too_hard" && canLowerCefrLevel(current.level)) {
    nextLevel = lowerCefrLevel(current.level);
    tooEasyStreak = 0;
    tooHardStreak = 0;
  }

  const level = nextLevel as PromptCefrLevel;
  const excludeIndex = level === current.level ? current.index : undefined;
  const { index } = pickRandomUnseenIndex(level, [], excludeIndex);

  return buildPromptState(level, index, tooEasyStreak, tooHardStreak);
}

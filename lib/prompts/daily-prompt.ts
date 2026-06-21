import { CefrLevel } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isUtcDateToday } from "@/lib/entries/service";
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

export type SeenPromptIndexes = Partial<Record<PromptCefrLevel, number[]>>;

/** Consecutive same-direction feedback votes needed to change prompt level. */
export const FEEDBACK_STREAK_THRESHOLD = 5;

export type DailyPromptState = {
  text: string;
  level: CefrLevel;
  index: number;
  canVoteTooEasy: boolean;
  canVoteTooHard: boolean;
};

function parseSeenIndexes(raw: unknown): SeenPromptIndexes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const result: SeenPromptIndexes = {};
  for (const [level, indexes] of Object.entries(raw)) {
    if (!Array.isArray(indexes)) continue;
    const nums = indexes
      .map((value) => {
        if (typeof value === "number") return value;
        if (typeof value === "string") return Number.parseInt(value, 10);
        return Number.NaN;
      })
      .filter((value) => Number.isInteger(value));
    if (nums.length > 0) {
      result[level as PromptCefrLevel] = nums;
    }
  }
  return result;
}

function getEffectivePromptLevel(
  estimated: CefrLevel,
  current: CefrLevel | null,
): CefrLevel {
  return current ?? estimated;
}

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

export function markPromptSeen(
  seen: SeenPromptIndexes,
  level: PromptCefrLevel,
  index: number,
  resetSeen: boolean,
): SeenPromptIndexes {
  if (resetSeen) {
    return { ...seen, [level]: [index] };
  }

  const levelSeen = [...(seen[level] ?? [])];
  if (!levelSeen.includes(index)) {
    levelSeen.push(index);
  }
  const total = getPromptCount(level);
  if (levelSeen.length >= total) {
    return { ...seen, [level]: [index] };
  }

  return { ...seen, [level]: levelSeen };
}

async function getOrEnsureUserLanguageForPrompt(
  userId: string,
  targetLanguage: string,
) {
  const forTarget = await prisma.userLanguage.findUnique({
    where: {
      userId_languageCode: { userId, languageCode: targetLanguage },
    },
  });

  if (forTarget) {
    return forTarget;
  }

  return prisma.userLanguage.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

function toDailyPromptState(
  level: CefrLevel,
  index: number,
): DailyPromptState {
  return {
    text: getPromptText(level as PromptCefrLevel, index),
    level,
    index,
    canVoteTooEasy: canBumpCefrLevel(level),
    canVoteTooHard: canLowerCefrLevel(level),
  };
}

type PromptAdvanceEntry = {
  promptIndex: number;
  promptLevel: CefrLevel;
};

function selectNextPromptForLevel(
  seen: SeenPromptIndexes,
  targetLevel: PromptCefrLevel,
  currentEntry?: PromptAdvanceEntry | null,
): { index: number; nextSeen: SeenPromptIndexes } {
  let updatedSeen = seen;

  if (currentEntry) {
    updatedSeen = markPromptSeen(
      updatedSeen,
      currentEntry.promptLevel as PromptCefrLevel,
      currentEntry.promptIndex,
      false,
    );
  }

  const excludeIndex =
    currentEntry?.promptLevel === targetLevel
      ? currentEntry.promptIndex
      : undefined;

  const { index, resetSeen } = pickRandomUnseenIndex(
    targetLevel,
    updatedSeen[targetLevel] ?? [],
    excludeIndex,
  );
  const nextSeen = markPromptSeen(updatedSeen, targetLevel, index, resetSeen);

  return { index, nextSeen };
}

async function persistDailyPrompt(
  entryId: string,
  userLanguageId: string,
  targetLevel: PromptCefrLevel,
  index: number,
  nextSeen: SeenPromptIndexes,
  userLanguageUpdates: {
    currentPromptLevel: CefrLevel;
    tooEasyStreak: number;
    tooHardStreak: number;
  },
) {
  await prisma.$transaction([
    prisma.journalEntry.update({
      where: { id: entryId },
      data: { promptLevel: targetLevel, promptIndex: index },
    }),
    prisma.userLanguage.update({
      where: { id: userLanguageId },
      data: {
        ...userLanguageUpdates,
        seenPromptIndexes: nextSeen,
      },
    }),
  ]);

  return toDailyPromptState(targetLevel, index);
}

async function assignPromptToEntry(
  entryId: string,
  userLanguage: {
    id: string;
    estimatedCefrLevel: CefrLevel;
    currentPromptLevel: CefrLevel | null;
    seenPromptIndexes: unknown;
    tooEasyStreak: number;
    tooHardStreak: number;
  },
) {
  const level = getEffectivePromptLevel(
    userLanguage.estimatedCefrLevel,
    userLanguage.currentPromptLevel,
  ) as PromptCefrLevel;
  const seen = parseSeenIndexes(userLanguage.seenPromptIndexes);
  const { index, nextSeen } = selectNextPromptForLevel(seen, level);

  return persistDailyPrompt(entryId, userLanguage.id, level, index, nextSeen, {
    currentPromptLevel: level,
    tooEasyStreak: userLanguage.tooEasyStreak,
    tooHardStreak: userLanguage.tooHardStreak,
  });
}

export async function getDailyPromptForEntry(
  userId: string,
  entryId: string,
  targetLanguage: string,
): Promise<DailyPromptState | null> {
  const [entry, userLanguage] = await Promise.all([
    prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
      select: { id: true, promptIndex: true, promptLevel: true },
    }),
    getOrEnsureUserLanguageForPrompt(userId, targetLanguage),
  ]);

  if (!entry || !userLanguage) {
    return null;
  }

  if (entry.promptIndex != null && entry.promptLevel != null) {
    return toDailyPromptState(entry.promptLevel, entry.promptIndex);
  }

  return assignPromptToEntry(entry.id, userLanguage);
}

async function advanceDailyPrompt(
  userId: string,
  entryId: string,
  targetLanguage: string,
  feedback?: PromptFeedback,
): Promise<DailyPromptState | null> {
  const [entry, userLanguage] = await Promise.all([
    prisma.journalEntry.findFirst({
      where: { id: entryId, userId },
      select: {
        id: true,
        entryDate: true,
        promptIndex: true,
        promptLevel: true,
      },
    }),
    getOrEnsureUserLanguageForPrompt(userId, targetLanguage),
  ]);

  if (!entry || !userLanguage || !isUtcDateToday(entry.entryDate)) {
    return null;
  }

  const effectiveLevel = getEffectivePromptLevel(
    userLanguage.estimatedCefrLevel,
    userLanguage.currentPromptLevel,
  );

  if (entry.promptIndex == null || entry.promptLevel == null) {
    return assignPromptToEntry(entry.id, userLanguage);
  }

  let nextLevel = effectiveLevel;
  let tooEasyStreak = userLanguage.tooEasyStreak;
  let tooHardStreak = userLanguage.tooHardStreak;

  if (feedback === "too_easy" && canBumpCefrLevel(effectiveLevel)) {
    tooEasyStreak += 1;
    tooHardStreak = 0;
    if (tooEasyStreak >= FEEDBACK_STREAK_THRESHOLD) {
      nextLevel = bumpCefrLevel(effectiveLevel);
      tooEasyStreak = 0;
    }
  } else if (feedback === "too_hard" && canLowerCefrLevel(effectiveLevel)) {
    tooHardStreak += 1;
    tooEasyStreak = 0;
    if (tooHardStreak >= FEEDBACK_STREAK_THRESHOLD) {
      nextLevel = lowerCefrLevel(effectiveLevel);
      tooHardStreak = 0;
    }
  }

  const targetLevel = nextLevel as PromptCefrLevel;
  const seen = parseSeenIndexes(userLanguage.seenPromptIndexes);
  const { index, nextSeen } = selectNextPromptForLevel(seen, targetLevel, {
    promptIndex: entry.promptIndex,
    promptLevel: entry.promptLevel,
  });

  return persistDailyPrompt(entryId, userLanguage.id, targetLevel, index, nextSeen, {
    currentPromptLevel: nextLevel,
    tooEasyStreak,
    tooHardStreak,
  });
}

export async function skipDailyPrompt(
  userId: string,
  entryId: string,
  targetLanguage: string,
): Promise<DailyPromptState | null> {
  return advanceDailyPrompt(userId, entryId, targetLanguage);
}

export type PromptFeedback = "too_easy" | "too_hard";

export async function recordPromptFeedback(
  userId: string,
  entryId: string,
  targetLanguage: string,
  feedback: PromptFeedback,
): Promise<{ ok: true; prompt: DailyPromptState } | { ok: false; error: "not_found" }> {
  const prompt = await advanceDailyPrompt(
    userId,
    entryId,
    targetLanguage,
    feedback,
  );

  if (!prompt) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true, prompt };
}

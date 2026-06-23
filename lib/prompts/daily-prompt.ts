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
  buildPromptState,
  FEEDBACK_STREAK_THRESHOLD,
  pickRandomUnseenIndex,
  type DailyPromptState,
  type PromptFeedback,
} from "@/lib/prompts/prompt-core";
import {
  getPromptCount,
  type PromptCefrLevel,
} from "@/lib/prompts/prompts";

export type {
  DailyPromptState,
  PromptFeedback,
} from "@/lib/prompts/prompt-core";
export {
  FEEDBACK_STREAK_THRESHOLD,
  pickRandomUnseenIndex,
} from "@/lib/prompts/prompt-core";

export type PromptTarget = {
  level: CefrLevel;
  index: number;
};

export type SeenPromptIndexes = Partial<Record<PromptCefrLevel, number[]>>;

type UserLanguageRow = {
  id: string;
  estimatedCefrLevel: CefrLevel;
  currentPromptLevel: CefrLevel | null;
  seenPromptIndexes: unknown;
  tooEasyStreak: number;
  tooHardStreak: number;
};

type PromptContext = {
  entry: {
    id: string;
    entryDate: Date;
    promptIndex: number | null;
    promptLevel: CefrLevel | null;
  };
  userLanguage: UserLanguageRow;
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

async function loadPromptContext(
  userId: string,
  entryId: string,
): Promise<PromptContext | null> {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: {
      id: true,
      entryDate: true,
      promptIndex: true,
      promptLevel: true,
      user: {
        select: {
          languageProfile: { select: { targetLanguage: true } },
          learningLanguages: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              languageCode: true,
              estimatedCefrLevel: true,
              currentPromptLevel: true,
              seenPromptIndexes: true,
              tooEasyStreak: true,
              tooHardStreak: true,
            },
          },
        },
      },
    },
  });

  if (!entry) {
    return null;
  }

  const targetLanguage = entry.user.languageProfile?.targetLanguage;
  const userLanguage =
    entry.user.learningLanguages.find(
      (lang) => lang.languageCode === targetLanguage,
    ) ?? entry.user.learningLanguages[0];

  if (!userLanguage) {
    return null;
  }

  return {
    entry: {
      id: entry.id,
      entryDate: entry.entryDate,
      promptIndex: entry.promptIndex,
      promptLevel: entry.promptLevel,
    },
    userLanguage,
  };
}

type PromptAdvanceEntry = {
  promptIndex: number;
  promptLevel: CefrLevel;
};

function isValidPromptTarget(
  level: PromptCefrLevel,
  index: number,
): boolean {
  return Number.isInteger(index) && index >= 0 && index < getPromptCount(level);
}

function selectNextPromptForLevel(
  seen: SeenPromptIndexes,
  targetLevel: PromptCefrLevel,
  currentEntry?: PromptAdvanceEntry | null,
  preferredIndex?: number,
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

  if (
    preferredIndex != null &&
    isValidPromptTarget(targetLevel, preferredIndex) &&
    preferredIndex !== excludeIndex
  ) {
    const nextSeen = markPromptSeen(
      updatedSeen,
      targetLevel,
      preferredIndex,
      false,
    );
    return { index: preferredIndex, nextSeen };
  }

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

  return buildPromptState(
    targetLevel,
    index,
    userLanguageUpdates.tooEasyStreak,
    userLanguageUpdates.tooHardStreak,
  );
}

async function assignPromptToEntry(
  entryId: string,
  userLanguage: UserLanguageRow,
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
): Promise<DailyPromptState | null> {
  const context = await loadPromptContext(userId, entryId);

  if (!context) {
    return null;
  }

  const { entry, userLanguage } = context;

  if (!isUtcDateToday(entry.entryDate)) {
    return null;
  }

  if (entry.promptIndex != null && entry.promptLevel != null) {
    return buildPromptState(
      entry.promptLevel,
      entry.promptIndex,
      userLanguage.tooEasyStreak,
      userLanguage.tooHardStreak,
    );
  }

  return assignPromptToEntry(entry.id, userLanguage);
}

async function advanceDailyPrompt(
  userId: string,
  entryId: string,
  feedback?: PromptFeedback,
  target?: PromptTarget,
): Promise<DailyPromptState | null> {
  const context = await loadPromptContext(userId, entryId);

  if (!context || !isUtcDateToday(context.entry.entryDate)) {
    return null;
  }

  const { entry, userLanguage } = context;

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
  const preferredIndex =
    target?.level === targetLevel ? target.index : undefined;
  const { index, nextSeen } = selectNextPromptForLevel(
    seen,
    targetLevel,
    {
      promptIndex: entry.promptIndex,
      promptLevel: entry.promptLevel,
    },
    preferredIndex,
  );

  return persistDailyPrompt(entryId, userLanguage.id, targetLevel, index, nextSeen, {
    currentPromptLevel: nextLevel,
    tooEasyStreak,
    tooHardStreak,
  });
}

export async function skipDailyPrompt(
  userId: string,
  entryId: string,
  target?: PromptTarget,
): Promise<DailyPromptState | null> {
  return advanceDailyPrompt(userId, entryId, undefined, target);
}

export async function recordPromptFeedback(
  userId: string,
  entryId: string,
  feedback: PromptFeedback,
  target?: PromptTarget,
): Promise<{ ok: true; prompt: DailyPromptState } | { ok: false; error: "not_found" }> {
  const prompt = await advanceDailyPrompt(userId, entryId, feedback, target);

  if (!prompt) {
    return { ok: false, error: "not_found" };
  }

  return { ok: true, prompt };
}

import { CefrLevel } from "@prisma/client";

import { CEFR_LEVELS, type PromptCefrLevel } from "@/lib/prompts/prompts";

const CEFR_ORDER: Record<PromptCefrLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

export function isPromptCefrLevel(value: string): value is PromptCefrLevel {
  return (CEFR_LEVELS as readonly string[]).includes(value);
}

export function bumpCefrLevel(level: CefrLevel): CefrLevel {
  const order = CEFR_ORDER[level as PromptCefrLevel];
  const next = CEFR_LEVELS.find((l) => CEFR_ORDER[l] === order + 1);
  return next ?? CefrLevel.C2;
}

export function lowerCefrLevel(level: CefrLevel): CefrLevel {
  const order = CEFR_ORDER[level as PromptCefrLevel];
  const prev = CEFR_LEVELS.find((l) => CEFR_ORDER[l] === order - 1);
  return prev ?? CefrLevel.A1;
}

export function canBumpCefrLevel(level: CefrLevel): boolean {
  return level !== CefrLevel.C2;
}

export function canLowerCefrLevel(level: CefrLevel): boolean {
  return level !== CefrLevel.A1;
}

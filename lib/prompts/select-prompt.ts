import { prisma } from "@/lib/db/prisma";
import { getPromptCefrBandsForDeclaredLevel } from "@/lib/level-calibration";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";

export type SelectPromptInput = {
  languageCode: string;
  declaredLevel: OnboardingLanguageLevel;
  mode: "ACADEMIC" | "FUN";
  recentPromptIds?: string[];
  bannedSafetyTags?: string[];
};

const CEFR_ORDER: Record<string, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

function rangesOverlap(a: { min: string; max: string }, b: { min: string; max: string }) {
  const aMin = CEFR_ORDER[a.min] ?? 0;
  const aMax = CEFR_ORDER[a.max] ?? 0;
  const bMin = CEFR_ORDER[b.min] ?? 0;
  const bMax = CEFR_ORDER[b.max] ?? 0;
  if (aMin === 0 || aMax === 0 || bMin === 0 || bMax === 0) return false;
  return aMin <= bMax && aMax >= bMin;
}

export async function selectPrompt(input: SelectPromptInput) {
  const [bandMin, bandMax] = getPromptCefrBandsForDeclaredLevel(input.declaredLevel);
  const recentIds = input.recentPromptIds ?? [];
  const bannedTags = input.bannedSafetyTags ?? [];

  const candidates = await prisma.prompt.findMany({
    where: {
      status: "ACTIVE",
      mode: input.mode,
      OR: [{ languageCode: input.languageCode }, { languageCode: "any" }],
      ...(bannedTags.length > 0
        ? {
            NOT: {
              safetyTags: { hasSome: bannedTags },
            },
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  const userBand = { min: String(bandMin), max: String(bandMax) };
  const inBand = candidates.filter((p) =>
    rangesOverlap(
      { min: String(p.minCefr), max: String(p.maxCefr) },
      userBand,
    ),
  );

  const notRecent =
    recentIds.length > 0 ? inBand.filter((p) => !recentIds.includes(p.id)) : inBand;

  return notRecent[0] ?? inBand[0] ?? null;
}


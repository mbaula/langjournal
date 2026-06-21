import { invalidateLanguagePairCache } from "@/lib/db/language";
import { LevelConfidence, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { mapDeclaredLevelToCefr } from "@/lib/level-calibration";
import type {
  OnboardingAgeRange,
  OnboardingLanguageLevel,
} from "@/lib/onboarding/constants";

export type UserLanguageEntry = {
  languageCode: string;
  level: OnboardingLanguageLevel;
};

export type OnboardingState = {
  displayName: string | null;
  ageRange: OnboardingAgeRange | null;
  languages: UserLanguageEntry[];
  isComplete: boolean;
};

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      ageRange: true,
      onboardingCompletedAt: true,
      learningLanguages: {
        select: { languageCode: true, level: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const languages: UserLanguageEntry[] =
    user?.learningLanguages.map((l) => ({
      languageCode: l.languageCode,
      level: l.level as OnboardingLanguageLevel,
    })) ?? [];

  const hasRequired = languages.length > 0;

  return {
    displayName: user?.displayName ?? null,
    ageRange: (user?.ageRange as OnboardingAgeRange | null) ?? null,
    languages,
    isComplete: Boolean(user?.onboardingCompletedAt) && hasRequired,
  };
}

async function syncUserLanguagesInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  languages: UserLanguageEntry[],
) {
  const now = new Date();
  const primaryLanguage = languages[0]?.languageCode ?? "fr";

  await tx.userLanguage.deleteMany({ where: { userId } });

  if (languages.length > 0) {
    await tx.userLanguage.createMany({
      data: languages.map((lang) => ({
        userId,
        languageCode: lang.languageCode,
        level: lang.level,
        estimatedCefrLevel: mapDeclaredLevelToCefr(lang.level),
        currentPromptLevel: mapDeclaredLevelToCefr(lang.level),
        levelConfidence: LevelConfidence.LOW,
        estimatedLevelUpdatedAt: now,
      })),
    });
  }

  await tx.languageProfile.update({
    where: { userId },
    data: { targetLanguage: primaryLanguage },
  });
}

async function syncUserLanguages(
  userId: string,
  languages: UserLanguageEntry[],
) {
  await prisma.$transaction(async (tx) => {
    await syncUserLanguagesInTransaction(tx, userId, languages);
  });

  invalidateLanguagePairCache();
}

export async function completeOnboarding(
  userId: string,
  input: {
    displayName: string | null;
    ageRange: OnboardingAgeRange | null;
    languages: UserLanguageEntry[];
  },
) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        ageRange: input.ageRange,
        onboardingCompletedAt: new Date(),
      },
    });

    await syncUserLanguagesInTransaction(tx, userId, input.languages);
  });

  invalidateLanguagePairCache();
}

export async function updateOnboardingProfile(
  userId: string,
  input: {
    displayName: string | null;
    ageRange: OnboardingAgeRange | null;
    languages: UserLanguageEntry[];
  },
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      displayName: input.displayName,
      ageRange: input.ageRange,
    },
  });

  await syncUserLanguages(userId, input.languages);
}

/** Dev-only: wipe onboarding progress so `/onboarding` can be exercised again. */
export async function resetOnboardingForDev(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        displayName: null,
        ageRange: null,
        onboardingCompletedAt: null,
      },
    });
    await tx.userLanguage.deleteMany({ where: { userId } });
  });

  invalidateLanguagePairCache();
}

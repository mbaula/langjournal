import { LevelConfidence } from "@prisma/client";

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

export async function completeOnboarding(
  userId: string,
  input: {
    displayName: string | null;
    ageRange: OnboardingAgeRange | null;
    languages: UserLanguageEntry[];
  },
) {
  const primaryLanguage = input.languages[0]?.languageCode ?? "fr";

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        ageRange: input.ageRange,
        onboardingCompletedAt: new Date(),
      },
    });

    await tx.userLanguage.deleteMany({
      where: { userId },
    });

    if (input.languages.length > 0) {
      const now = new Date();
      await tx.userLanguage.createMany({
        data: input.languages.map((lang) => ({
          userId,
          languageCode: lang.languageCode,
          level: lang.level,
          estimatedCefrLevel: mapDeclaredLevelToCefr(lang.level),
          levelConfidence: LevelConfidence.LOW,
          estimatedLevelUpdatedAt: now,
        })),
      });
    }

    await tx.languageProfile.update({
      where: { userId },
      data: {
        targetLanguage: primaryLanguage,
      },
    });
  });
}

import { prisma } from "@/lib/db/prisma";

export async function getLanguagePair(userId: string) {
  const profile = await prisma.languageProfile.findUnique({
    where: { userId },
  });

  return {
    source: profile?.nativeLanguage ?? "en",
    target: profile?.targetLanguage ?? "fr",
  };
}

export async function getLanguageProfile(userId: string) {
  return prisma.languageProfile.findUnique({ where: { userId } });
}

export async function updateLanguageProfile(
  userId: string,
  data: { nativeLanguage: string; targetLanguage: string },
) {
  return prisma.languageProfile.update({
    where: { userId },
    data: {
      nativeLanguage: data.nativeLanguage,
      targetLanguage: data.targetLanguage,
    },
  });
}

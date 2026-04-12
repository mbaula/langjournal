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

import { revalidateTag, unstable_cache } from "next/cache";

import { prisma } from "@/lib/db/prisma";

export function languagePairFromProfile(
  profile:
    | { nativeLanguage: string; targetLanguage: string }
    | null
    | undefined,
) {
  return {
    source: profile?.nativeLanguage ?? "en",
    target: profile?.targetLanguage ?? "fr",
  };
}

const getCachedLanguagePair = unstable_cache(
  async (userId: string) => {
    const profile = await prisma.languageProfile.findUnique({
      where: { userId },
      select: { nativeLanguage: true, targetLanguage: true },
    });
    return languagePairFromProfile(profile);
  },
  ["language-pair"],
  { revalidate: 300, tags: ["language-pair"] }
);

export async function getLanguagePair(userId: string) {
  return getCachedLanguagePair(userId);
}

export function invalidateLanguagePairCache() {
  revalidateTag("language-pair", { expire: 0 });
}

export async function getLanguageProfile(userId: string) {
  return prisma.languageProfile.findUnique({ where: { userId } });
}

export async function updateLanguageProfile(
  userId: string,
  data: { nativeLanguage: string; targetLanguage: string },
) {
  const result = await prisma.languageProfile.update({
    where: { userId },
    data: {
      nativeLanguage: data.nativeLanguage,
      targetLanguage: data.targetLanguage,
    },
  });
  invalidateLanguagePairCache();
  return result;
}

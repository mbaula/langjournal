import { prisma } from "@/lib/db/prisma";

export async function ensureAppUser(userId: string, email: string) {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });

  // Use upsert to handle race conditions where multiple requests
  // might try to create the profile simultaneously
  await prisma.languageProfile.upsert({
    where: { userId },
    create: {
      userId,
      nativeLanguage: "en",
      targetLanguage: "fr",
      uiLocale: "en",
    },
    update: {},
  });
}

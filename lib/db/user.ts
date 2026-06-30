import { prisma } from "@/lib/db/prisma";

export async function ensureAppUser(userId: string, email: string) {
  try {
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
        sourceLanguage: "en",
        targetLanguage: "fr",
        uiLocale: "en",
      },
      update: {},
    });
  } catch (error) {
    console.error("ensureAppUser failed:", error);
    // Don't throw - allow the user to continue even if profile setup fails
  }
}

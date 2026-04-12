import { prisma } from "@/lib/db/prisma";

export async function ensureAppUser(userId: string, email: string) {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });

  const profile = await prisma.languageProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    await prisma.languageProfile.create({
      data: {
        userId,
        nativeLanguage: "en",
        targetLanguage: "fr",
        uiLocale: "en",
      },
    });
  }
}

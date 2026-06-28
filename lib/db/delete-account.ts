import { deleteUserFlashcardAudioDir } from "@/lib/flashcards/audio-storage";
import { prisma } from "@/lib/db/prisma";

export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.promptUsage.deleteMany({ where: { userId } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await deleteUserFlashcardAudioDir(userId);
}

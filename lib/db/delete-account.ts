import { deleteUserFlashcardAudioDir } from "@/lib/flashcards/audio-storage";
import { prisma } from "@/lib/db/prisma";

export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.promptUsage.deleteMany({ where: { userId } });
  await deleteUserFlashcardAudioDir(userId);
  await prisma.user.delete({ where: { id: userId } });
}

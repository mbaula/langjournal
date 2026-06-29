import { FlashcardsView } from "@/components/flashcards/flashcards-view";
import { appPageShellClassName } from "@/components/journal/field-styles";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import {
  getDevPreviewFlashcards,
  getDevPreviewFlashcardStats,
} from "@/lib/dev/preview-account";
import { getLanguagePair } from "@/lib/db/language";
import {
  getPracticeStatsForUser,
  listFlashcardsForUserDisplay,
} from "@/lib/flashcards/service";

function countItems(
  flashcards: Awaited<ReturnType<typeof listFlashcardsForUserDisplay>>,
): number {
  return flashcards.length;
}

export default async function FlashcardsPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const previewFlashcards = getDevPreviewFlashcards();
    return (
      <div className={appPageShellClassName}>
        <FlashcardsView
          initialFlashcards={previewFlashcards}
          initialStats={getDevPreviewFlashcardStats()}
          initialItemCount={countItems(previewFlashcards)}
          nativeLanguage="en"
          targetLanguage="fr"
          previewMode
        />
      </div>
    );
  }

  const user = await requireAppSession();
  const { source, target } = await getLanguagePair(user.id);

  let flashcards: Awaited<ReturnType<typeof listFlashcardsForUserDisplay>> = [];
  let stats: Awaited<ReturnType<typeof getPracticeStatsForUser>> = {
    currentStreak: 0,
    lastPracticeDate: null,
  };

  try {
    [flashcards, stats] = await Promise.all([
      listFlashcardsForUserDisplay(user.id, target),
      getPracticeStatsForUser(user.id),
    ]);
  } catch (error) {
    console.error("Flashcard page load failed:", error);
  }

  return (
    <div className={appPageShellClassName}>
      <FlashcardsView
        initialFlashcards={flashcards}
        initialStats={stats}
        initialItemCount={countItems(flashcards)}
        nativeLanguage={source}
        targetLanguage={target}
      />
    </div>
  );
}

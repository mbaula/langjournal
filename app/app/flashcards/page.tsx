import { FlashcardsView } from "@/components/flashcards/flashcards-view";
import { appPageShellClassName } from "@/components/journal/field-styles";
import { isAccountPreviewMode, requireUser } from "@/lib/auth/session";
import {
  getDevPreviewFlashcards,
  getDevPreviewFlashcardStats,
} from "@/lib/dev/preview-account";
import { getLanguagePair } from "@/lib/db/language";
import {
  getPracticeStatsForUser,
  listFlashcardsForUser,
  syncFlashcardsFromJournalEntries,
} from "@/lib/flashcards/service";

function countItemsForLanguage(
  flashcards: Awaited<ReturnType<typeof listFlashcardsForUser>>,
  languageCode: string,
): number {
  return flashcards.filter((card) => card.languageCode === languageCode).length;
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
          initialItemCount={countItemsForLanguage(previewFlashcards, "fr")}
          nativeLanguage="en"
          targetLanguage="fr"
          previewMode
        />
      </div>
    );
  }

  const user = await requireUser();
  const { source, target } = await getLanguagePair(user.id);

  try {
    await syncFlashcardsFromJournalEntries(user.id, target);
  } catch {
    // Sync is best-effort; client also retries via /api/flashcards?sync=1.
  }

  let flashcards: Awaited<ReturnType<typeof listFlashcardsForUser>> = [];
  let stats: Awaited<ReturnType<typeof getPracticeStatsForUser>> = {
    currentStreak: 0,
    lastPracticeDate: null,
  };

  try {
    [flashcards, stats] = await Promise.all([
      listFlashcardsForUser(user.id),
      getPracticeStatsForUser(user.id),
    ]);
  } catch {
    // Tables may be missing until migrations run; client fetch will retry.
  }

  return (
    <div className={appPageShellClassName}>
      <FlashcardsView
        initialFlashcards={flashcards}
        initialStats={stats}
        initialItemCount={countItemsForLanguage(flashcards, target)}
        nativeLanguage={source}
        targetLanguage={target}
      />
    </div>
  );
}

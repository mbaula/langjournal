import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { getLanguagePair } from "@/lib/db/language";
import {
  getPracticeStatsForUser,
  listDistinctFlashcardLanguages,
  listFlashcardsForUser,
  syncFlashcardsFromJournalEntries,
} from "@/lib/flashcards/service";
import { flashcardListQuerySchema } from "@/lib/validations/flashcard";

export async function GET(request: Request) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = flashcardListQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    proficiency: url.searchParams.get("proficiency") ?? undefined,
    language: url.searchParams.get("language") ?? undefined,
    addedAfter: url.searchParams.get("addedAfter") ?? undefined,
    addedBefore: url.searchParams.get("addedBefore") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const sync = url.searchParams.get("sync") === "1";
  if (sync) {
    const { target } = await getLanguagePair(user.id);
    await syncFlashcardsFromJournalEntries(user.id, target);
  }

  const [flashcards, languages, stats] = await Promise.all([
    listFlashcardsForUser(user.id, parsed.data),
    listDistinctFlashcardLanguages(user.id),
    getPracticeStatsForUser(user.id),
  ]);

  return NextResponse.json({ flashcards, languages, stats });
}

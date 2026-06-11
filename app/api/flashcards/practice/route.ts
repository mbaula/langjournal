import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { completePracticeSession } from "@/lib/flashcards/service";
import { completePracticeSessionSchema } from "@/lib/validations/flashcard";

export async function POST(request: Request) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = completePracticeSessionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await completePracticeSession({
    userId: user.id,
    reviews: parsed.data.reviews,
  });

  return NextResponse.json({
    reviewedCount: parsed.data.reviews.length,
    masteredCount: result.masteredCount,
    stats: result.stats,
    flashcards: result.cards,
  });
}

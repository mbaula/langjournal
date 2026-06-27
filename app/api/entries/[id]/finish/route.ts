import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getAuthenticatedUserId } from "@/lib/auth/api-user";
import { finishJournalEntryForToday } from "@/lib/entries/service";
import { assignDailyPromptForNewDraft } from "@/lib/prompts/daily-prompt";
import { finishJournalEntryBodySchema } from "@/lib/validations/entry";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let snapshot: {
    title?: string;
    body?: string;
    translations?: Array<{
      id: string;
      sourceText: string;
      translatedText: string;
      spans?: Array<{ start: number; end: number }>;
    }>;
  } = {};

  try {
    const text = await request.text();
    if (text) {
      const parsed = finishJournalEntryBodySchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", issues: parsed.error.flatten() },
          { status: 400 },
        );
      }
      snapshot = parsed.data;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await finishJournalEntryForToday(id, userId, snapshot);

    if (!result.ok) {
      if (result.error === "empty") {
        return NextResponse.json(
          { error: "Write something before saving." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Entry not found or already saved." },
        { status: 404 },
      );
    }

    let dailyPrompt = null;
    try {
      dailyPrompt = await assignDailyPromptForNewDraft(
        userId,
        result.newEntry.id,
        result.previousPrompt,
      );
    } catch (promptError) {
      console.error("Failed to assign prompt for new draft entry", promptError);
    }

    return NextResponse.json({
      completedEntry: result.completedEntry,
      newEntry: result.newEntry,
      dailyPrompt,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Database needs a migration to allow multiple entries per day. Run prisma db push.",
        },
        { status: 409 },
      );
    }

    console.error("Failed to finish journal entry", error);
    return NextResponse.json(
      { error: "Couldn't save your entry. Try again." },
      { status: 500 },
    );
  }
}

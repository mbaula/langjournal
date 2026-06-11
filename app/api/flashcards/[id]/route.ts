import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { deleteFlashcardAudio } from "@/lib/flashcards/audio-storage";
import {
  deleteFlashcardForUser,
  getFlashcardForUser,
  updateFlashcardForUser,
} from "@/lib/flashcards/service";
import { patchFlashcardBodySchema } from "@/lib/validations/flashcard";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const flashcard = await getFlashcardForUser(id, user.id);
  if (!flashcard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ flashcard });
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchFlashcardBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const flashcard = await updateFlashcardForUser(id, user.id, parsed.data);
  if (!flashcard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ flashcard });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteFlashcardForUser(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFlashcardAudio(user.id, id);
  return new NextResponse(null, { status: 204 });
}

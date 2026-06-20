import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import {
  deleteFlashcardAudio,
  isAcceptedAudioMimeType,
  readFlashcardAudio,
  saveFlashcardAudio,
} from "@/lib/flashcards/audio-storage";
import {
  getFlashcardForUser,
  setFlashcardAudioMimeType,
} from "@/lib/flashcards/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const flashcard = await getFlashcardForUser(id, user.id);
  if (!flashcard?.hasAudio) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await readFlashcardAudio(
    user.id,
    id,
    flashcard.audioMimeType,
  );
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": flashcard.audioMimeType ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const flashcard = await getFlashcardForUser(id, user.id);
  if (!flashcard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAcceptedAudioMimeType(mimeType)) {
    return NextResponse.json(
      { error: "Unsupported audio format. Use mp3, m4a, or wav." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty audio file" }, { status: 400 });
  }

  if (buffer.length > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Audio file too large (max 5 MB)" },
      { status: 400 },
    );
  }

  await saveFlashcardAudio(user.id, id, mimeType, buffer);
  const updated = await setFlashcardAudioMimeType(id, user.id, mimeType);
  return NextResponse.json({ flashcard: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const flashcard = await getFlashcardForUser(id, user.id);
  if (!flashcard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteFlashcardAudio(user.id, id);
  const updated = await setFlashcardAudioMimeType(id, user.id, null);
  return NextResponse.json({ flashcard: updated });
}

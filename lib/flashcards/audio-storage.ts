import { mkdir, readFile, rm, unlink, writeFile } from "fs/promises";
import path from "path";

const AUDIO_ROOT = path.join(process.cwd(), ".data", "flashcards-audio");

const EXT_BY_MIME: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export const ACCEPTED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
]);

export function isAcceptedAudioMimeType(mimeType: string): boolean {
  return ACCEPTED_AUDIO_MIME_TYPES.has(mimeType);
}

function audioPath(userId: string, flashcardId: string, ext: string): string {
  return path.join(AUDIO_ROOT, userId, `${flashcardId}.${ext}`);
}

export async function saveFlashcardAudio(
  userId: string,
  flashcardId: string,
  mimeType: string,
  data: Buffer,
): Promise<void> {
  const ext = EXT_BY_MIME[mimeType] ?? "bin";
  const dir = path.join(AUDIO_ROOT, userId);
  await mkdir(dir, { recursive: true });

  for (const candidateExt of new Set(Object.values(EXT_BY_MIME))) {
    try {
      await unlink(audioPath(userId, flashcardId, candidateExt));
    } catch {
      // ignore missing files
    }
  }

  await writeFile(audioPath(userId, flashcardId, ext), data);
}

export async function readFlashcardAudio(
  userId: string,
  flashcardId: string,
  mimeType: string | null,
): Promise<Buffer | null> {
  const preferredExt = mimeType ? EXT_BY_MIME[mimeType] : undefined;
  const extensions = preferredExt
    ? [preferredExt, ...Object.values(EXT_BY_MIME)]
    : Object.values(EXT_BY_MIME);

  for (const ext of new Set(extensions)) {
    try {
      return await readFile(audioPath(userId, flashcardId, ext));
    } catch {
      // try next extension
    }
  }

  return null;
}

export async function deleteUserFlashcardAudioDir(userId: string): Promise<void> {
  try {
    await rm(path.join(AUDIO_ROOT, userId), { recursive: true, force: true });
  } catch {
    // ignore missing directories
  }
}

export async function deleteFlashcardAudio(
  userId: string,
  flashcardId: string,
): Promise<void> {
  for (const ext of new Set(Object.values(EXT_BY_MIME))) {
    try {
      await unlink(audioPath(userId, flashcardId, ext));
    } catch {
      // ignore missing files
    }
  }
}

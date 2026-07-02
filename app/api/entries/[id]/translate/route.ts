import { randomUUID } from "crypto";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { languagePairFromProfile } from "@/lib/db/language";
import { prisma } from "@/lib/db/prisma";
import {
  type InlineTranslation,
  removeTranslation,
  resolveCommitTranslation,
  type TranslationSpan,
} from "@/lib/entries/translate";
import { appendTranslationSpan } from "@/lib/entries/translation-spans";

type RouteContext = { params: Promise<{ id: string }> };

function adjustSpanForCRLFNormalization(
  rawBody: string,
  span: { start: number; end: number },
): { start: number; end: number } {
  let crlfCountBefore = 0;
  for (let i = 0; i < span.start && i < rawBody.length - 1; i++) {
    if (rawBody[i] === "\r" && rawBody[i + 1] === "\n") {
      crlfCountBefore++;
    }
  }
  let crlfCountInSpan = 0;
  for (let i = span.start; i < span.end && i < rawBody.length - 1; i++) {
    if (rawBody[i] === "\r" && rawBody[i + 1] === "\n") {
      crlfCountInSpan++;
    }
  }
  return {
    start: span.start - crlfCountBefore,
    end: span.end - crlfCountBefore - crlfCountInSpan,
  };
}

function parseHighlightSpan(
  json: unknown,
  normalizedBody: string | undefined,
  translatedText: string,
  rawBody?: string,
): TranslationSpan | null {
  if (typeof json !== "object" || json === null || !("highlightSpan" in json)) {
    return null;
  }

  const span = (json as { highlightSpan: unknown }).highlightSpan;
  if (
    typeof span !== "object" ||
    span === null ||
    typeof (span as { start?: unknown }).start !== "number" ||
    typeof (span as { end?: unknown }).end !== "number"
  ) {
    return null;
  }

  const rawSpan = span as { start: number; end: number };
  if (
    !Number.isInteger(rawSpan.start) ||
    !Number.isInteger(rawSpan.end) ||
    rawSpan.start < 0 ||
    rawSpan.end <= rawSpan.start
  ) {
    return null;
  }

  const adjusted =
    typeof rawBody === "string"
      ? adjustSpanForCRLFNormalization(rawBody, rawSpan)
      : rawSpan;
  const { start, end } = adjusted;

  if (typeof normalizedBody !== "string") return null;
  if (normalizedBody.slice(start, end) !== translatedText) return null;
  return { start, end };
}

/** Persist inline translation metadata for an entry (commit only). */
export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: entryId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text =
    typeof json === "object" && json !== null && "text" in json
      ? (json as { text: unknown }).text
      : undefined;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "text (non-empty string) is required" },
      { status: 400 },
    );
  }

  const rawBody =
    typeof json === "object" && json !== null && "body" in json
      ? (json as { body: unknown }).body
      : undefined;
  const body =
    typeof rawBody === "string" ? rawBody.replace(/\r\n/g, "\n") : rawBody;

  const rawClientTranslatedText =
    typeof json === "object" && json !== null && "translatedText" in json
      ? (json as { translatedText: unknown }).translatedText
      : undefined;
  const clientTranslatedText =
    typeof rawClientTranslatedText === "string"
      ? rawClientTranslatedText.replace(/\r\n/g, "\n")
      : rawClientTranslatedText;

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    select: {
      id: true,
      body: true,
      translations: true,
      user: {
        select: {
          languageProfile: {
            select: { nativeLanguage: true, targetLanguage: true },
          },
        },
      },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing: InlineTranslation[] = Array.isArray(entry.translations)
    ? (entry.translations as InlineTranslation[])
    : [];

  const { source, target } = languagePairFromProfile(
    entry.user.languageProfile,
  );

  const result = await resolveCommitTranslation(
    text,
    existing,
    source,
    target,
    typeof clientTranslatedText === "string" ? clientTranslatedText : undefined,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const effectiveTranslatedText =
    typeof clientTranslatedText === "string"
      ? clientTranslatedText
      : result.translatedText;

  const highlightSpan = parseHighlightSpan(
    json,
    typeof body === "string" ? body : undefined,
    effectiveTranslatedText,
    typeof rawBody === "string" ? rawBody : undefined,
  );

  if (result.fromExisting) {
    if (!highlightSpan) {
      return NextResponse.json({ translation: result.fromExisting });
    }

    const canAppendToExisting =
      result.fromExisting.translatedText === effectiveTranslatedText;

    if (canAppendToExisting) {
      const updatedTranslation = appendTranslationSpan(
        result.fromExisting,
        highlightSpan,
        body as string,
      );

      if (updatedTranslation !== result.fromExisting) {
        const nextTranslations = existing.map((t) =>
          t.id === updatedTranslation.id ? updatedTranslation : t,
        );

        await prisma.journalEntry.update({
          where: { id: entryId },
          data: {
            translations: nextTranslations as Prisma.InputJsonValue,
          },
        });

        return NextResponse.json({ translation: updatedTranslation });
      }
    }

    const record: InlineTranslation = {
      id: randomUUID(),
      sourceText: result.sourceText,
      translatedText: effectiveTranslatedText,
      spans: [highlightSpan],
    };

    await prisma.journalEntry.update({
      where: { id: entryId },
      data: {
        translations: [...existing, record] as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ translation: record });
  }

  const record: InlineTranslation = {
    id: randomUUID(),
    sourceText: result.sourceText,
    translatedText: effectiveTranslatedText,
    spans: highlightSpan ? [highlightSpan] : undefined,
  };

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      translations: [...existing, record] as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ translation: record });
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: entryId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const translationId =
    typeof json === "object" && json !== null && "translationId" in json
      ? (json as { translationId: unknown }).translationId
      : undefined;

  if (typeof translationId !== "string") {
    return NextResponse.json(
      { error: "translationId (string) is required" },
      { status: 400 },
    );
  }

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    select: { id: true, translations: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing: InlineTranslation[] = Array.isArray(entry.translations)
    ? (entry.translations as InlineTranslation[])
    : [];

  const updated = removeTranslation(existing, translationId);

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      translations: updated as Prisma.InputJsonValue,
    },
  });

  await prisma.flashcard.deleteMany({
    where: { userId: user.id, translationId },
  });

  return NextResponse.json({ translations: updated });
}

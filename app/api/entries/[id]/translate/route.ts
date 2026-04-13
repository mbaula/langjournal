import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { getLanguagePair } from "@/lib/db/language";
import { prisma } from "@/lib/db/prisma";
import {
  type InlineTranslation,
  removeTranslation,
  translateSlashLines,
} from "@/lib/entries/translate";

type RouteContext = { params: Promise<{ id: string }> };

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

  const bodyText =
    typeof json === "object" && json !== null && "body" in json
      ? (json as { body: unknown }).body
      : undefined;

  if (typeof bodyText !== "string") {
    return NextResponse.json(
      { error: "body (string) is required" },
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

  const { source, target } = await getLanguagePair(user.id);

  const result = await translateSlashLines(
    bodyText,
    existing,
    source,
    target,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await prisma.journalEntry.update({
    where: { id: entryId },
    data: {
      body: bodyText.replace(/\r\n/g, "\n"),
      translations: JSON.parse(JSON.stringify(result.translations)),
    },
  });

  return NextResponse.json({
    translations: result.translations,
  });
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
      translations: JSON.parse(JSON.stringify(updated)),
    },
  });

  return NextResponse.json({ translations: updated });
}

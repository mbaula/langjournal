import { BlockType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

const MAX_PLAIN_TEXT_CHARS = 100_000;

export type TextBlockRow = {
  id: string;
  sourceText: string;
  position: number;
  createdAt: Date;
};

export async function listTextBlocksForEntry(
  entryId: string,
  userId: string,
): Promise<TextBlockRow[] | null> {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return null;
  }

  return prisma.entryBlock.findMany({
    where: { entryId, type: BlockType.text },
    orderBy: { position: "asc" },
    select: {
      id: true,
      sourceText: true,
      position: true,
      createdAt: true,
    },
  });
}

export async function createTextBlockForEntry(
  entryId: string,
  userId: string,
  rawText: string,
  sourceLanguage: string,
) {
  const text = rawText.replace(/\r\n/g, "\n").trim();

  if (!text) {
    return { ok: false as const, error: "empty_text" as const };
  }

  if (text.length > MAX_PLAIN_TEXT_CHARS) {
    return { ok: false as const, error: "text_too_long" as const };
  }

  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId },
    select: { id: true },
  });

  if (!entry) {
    return { ok: false as const, error: "entry_not_found" as const };
  }

  const last = await prisma.entryBlock.findFirst({
    where: { entryId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (last?.position ?? -1) + 1;

  const block = await prisma.entryBlock.create({
    data: {
      entryId,
      type: BlockType.text,
      sourceText: text,
      sourceLanguage,
      position,
    },
    select: {
      id: true,
      sourceText: true,
      position: true,
      createdAt: true,
    },
  });

  return { ok: true as const, block };
}

export async function updateTextBlockForUser(
  blockId: string,
  userId: string,
  rawText: string,
) {
  const text = rawText.replace(/\r\n/g, "\n").trim();

  if (text.length > MAX_PLAIN_TEXT_CHARS) {
    return { ok: false as const, error: "text_too_long" as const };
  }

  const block = await prisma.entryBlock.findFirst({
    where: { id: blockId, type: BlockType.text },
    include: {
      entry: { select: { userId: true } },
    },
  });

  if (!block || block.entry.userId !== userId) {
    return { ok: false as const, error: "not_found" as const };
  }

  const updated = await prisma.entryBlock.update({
    where: { id: blockId },
    data: { sourceText: text },
    select: {
      id: true,
      sourceText: true,
      position: true,
      createdAt: true,
    },
  });

  return { ok: true as const, block: updated };
}

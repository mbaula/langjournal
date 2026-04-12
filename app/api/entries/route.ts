import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import {
  getOrCreateJournalEntryForDate,
  listJournalEntries,
} from "@/lib/entries/service";
import {
  createJournalEntryBodySchema,
  parseEntryDate,
} from "@/lib/validations/entry";

export async function GET() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await listJournalEntries(user.id);
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown = {};
  try {
    const text = await request.text();
    if (text) {
      json = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createJournalEntryBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const entryDate = parseEntryDate(parsed.data.entryDate ?? null);
  const { entry, created } = await getOrCreateJournalEntryForDate(
    user.id,
    entryDate,
    parsed.data.title,
  );

  return NextResponse.json(
    { entry, created },
    { status: created ? 201 : 200 },
  );
}

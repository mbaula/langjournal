import { NextResponse } from "next/server";

import { getAuthenticatedUserId } from "@/lib/auth/api-user";
import {
  deleteJournalEntryForUser,
  getJournalEntryForUser,
  updateJournalEntryBody,
  updateJournalEntryTitle,
  updateJournalEntryTranslations,
} from "@/lib/entries/service";
import { patchJournalEntryBodySchema } from "@/lib/validations/entry";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const entry = await getJournalEntryForUser(id, userId);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchJournalEntryBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.title !== undefined) {
    const result = await updateJournalEntryTitle(id, userId, parsed.data.title);
    if (!result.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (parsed.data.body !== undefined) {
    const result = await updateJournalEntryBody(id, userId, parsed.data.body);
    if (!result.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (parsed.data.translations !== undefined) {
    const result = await updateJournalEntryTranslations(
      id,
      userId,
      parsed.data.translations,
    );
    if (!result.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const entry = await getJournalEntryForUser(id, userId);
  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteJournalEntryForUser(id, userId);

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import {
  deleteJournalEntryForUser,
  getJournalEntryForUser,
  updateJournalEntryBody,
  updateJournalEntryTitle,
} from "@/lib/entries/service";
import { patchJournalEntryBodySchema } from "@/lib/validations/entry";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const entry = await getJournalEntryForUser(id, user.id);

  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
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

  const parsed = patchJournalEntryBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.title !== undefined) {
    const result = await updateJournalEntryTitle(id, user.id, parsed.data.title);
    if (!result.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (parsed.data.body !== undefined) {
    const result = await updateJournalEntryBody(id, user.id, parsed.data.body);
    if (!result.ok) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const entry = await getJournalEntryForUser(id, user.id);
  return NextResponse.json({ entry });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await deleteJournalEntryForUser(id, user.id);

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}

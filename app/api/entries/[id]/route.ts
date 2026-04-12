import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { getJournalEntryForUser } from "@/lib/entries/service";

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

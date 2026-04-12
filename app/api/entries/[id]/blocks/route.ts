import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { createTextBlockForEntry } from "@/lib/blocks/service";
import { getLanguagePair } from "@/lib/db/language";
import { createTextBlockBodySchema } from "@/lib/validations/block";

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

  const parsed = createTextBlockBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { source } = await getLanguagePair(user.id);
  const result = await createTextBlockForEntry(
    entryId,
    user.id,
    parsed.data.text,
    source,
  );

  if (!result.ok) {
    if (result.error === "entry_not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.error === "empty_text") {
      return NextResponse.json({ error: "Text is empty" }, { status: 400 });
    }
    if (result.error === "text_too_long") {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  return NextResponse.json(
    {
      block: {
        ...result.block,
        createdAt: result.block.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
}

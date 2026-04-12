import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { updateTextBlockForUser } from "@/lib/blocks/service";
import { updateTextBlockBodySchema } from "@/lib/validations/block";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: blockId } = await context.params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTextBlockBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await updateTextBlockForUser(
    blockId,
    user.id,
    parsed.data.text,
  );

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (result.error === "text_too_long") {
      return NextResponse.json({ error: "Text is too long" }, { status: 400 });
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  return NextResponse.json({
    block: {
      ...result.block,
      createdAt: result.block.createdAt.toISOString(),
    },
  });
}

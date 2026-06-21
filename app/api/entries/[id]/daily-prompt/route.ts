import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { getLanguagePair } from "@/lib/db/language";
import {
  getDailyPromptForEntry,
  recordPromptFeedback,
  skipDailyPrompt,
} from "@/lib/prompts/daily-prompt";
import { dailyPromptActionSchema } from "@/lib/validations/daily-prompt";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { target } = await getLanguagePair(user.id);
  const prompt = await getDailyPromptForEntry(user.id, id, target);

  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt });
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = dailyPromptActionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { target } = await getLanguagePair(user.id);

  if (parsed.data.action === "skip") {
    const prompt = await skipDailyPrompt(user.id, id, target);
    if (!prompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ prompt });
  }

  const result = await recordPromptFeedback(
    user.id,
    id,
    target,
    parsed.data.feedback,
  );

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt: result.prompt });
}

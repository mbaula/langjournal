import { NextResponse } from "next/server";

import {
  getAuthenticatedAppUser,
  getAuthenticatedUserId,
} from "@/lib/auth/api-user";
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
  const prompt = await getDailyPromptForEntry(user.id, id);

  if (!prompt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt });
}

export async function POST(request: Request, context: RouteContext) {
  const userPromise = getAuthenticatedUserId();
  const paramsPromise = context.params;

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

  const [user, { id }] = await Promise.all([userPromise, paramsPromise]);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target = parsed.data.target;

  if (parsed.data.action === "skip") {
    const prompt = await skipDailyPrompt(user, id, target);
    if (!prompt) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ prompt });
  }

  const result = await recordPromptFeedback(
    user,
    id,
    parsed.data.feedback,
    target,
  );

  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ prompt: result.prompt });
}

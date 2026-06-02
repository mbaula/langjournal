import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { resolveRealtimeTranslation } from "@/lib/translate/realtime";
import { realtimeTranslateSchema } from "@/lib/validations/translate-realtime";

/** Lightweight translate for editor prefetch — no entry or DB. */
export async function POST(request: Request) {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = realtimeTranslateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 },
    );
  }

  const { text, source, target } = parsed.data;
  const result = await resolveRealtimeTranslation(text, source, target);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    sourceText: result.sourceText,
    translatedText: result.translatedText,
  });
}

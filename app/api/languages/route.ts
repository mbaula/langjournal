import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { FALLBACK_LANGUAGES } from "@/lib/languages/fallback-languages";
import { listGoogleTranslationLanguages } from "@/lib/translate/google";

/** Supported translation languages (from Google when configured, else fallback). */
export async function GET() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fromGoogle = await listGoogleTranslationLanguages();
  return NextResponse.json({
    languages: fromGoogle ?? FALLBACK_LANGUAGES,
  });
}

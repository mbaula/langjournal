import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { getSupportedLanguages } from "@/lib/languages/supported-languages";

/** Supported translation languages (from Google when configured, else fallback). */
export async function GET() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const languages = await getSupportedLanguages();
  return NextResponse.json({ languages });
}

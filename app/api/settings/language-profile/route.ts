import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import {
  getLanguageProfile,
  updateLanguageProfile,
} from "@/lib/db/language";
import { patchLanguageProfileSchema } from "@/lib/validations/language-profile";

export async function GET() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getLanguageProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    nativeLanguage: profile.nativeLanguage,
    targetLanguage: profile.targetLanguage,
    uiLocale: profile.uiLocale,
  });
}

export async function PATCH(request: Request) {
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

  const parsed = patchLanguageProfileSchema.safeParse(json);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      [...flat.formErrors, ...Object.values(flat.fieldErrors).flat()][0] ??
      parsed.error.issues[0]?.message;
    return NextResponse.json(
      { error: first ?? "Invalid body" },
      { status: 400 },
    );
  }

  try {
    await updateLanguageProfile(user.id, parsed.data);
  } catch {
    return NextResponse.json({ error: "Could not update" }, { status: 500 });
  }

  const profile = await getLanguageProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    nativeLanguage: profile.nativeLanguage,
    targetLanguage: profile.targetLanguage,
    uiLocale: profile.uiLocale,
  });
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { updateUiLocale } from "@/lib/db/language";
import { localeCookieOptions } from "@/lib/i18n/cookie";
import { patchUiLocaleSchema } from "@/lib/validations/language-profile";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchUiLocaleSchema.safeParse(json);
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

  const { uiLocale } = parsed.data;
  const user = await getAuthenticatedAppUser();

  if (user) {
    try {
      await updateUiLocale(user.id, uiLocale);
    } catch {
      return NextResponse.json({ error: "Could not update" }, { status: 500 });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(localeCookieOptions(uiLocale));

  return NextResponse.json({ uiLocale });
}

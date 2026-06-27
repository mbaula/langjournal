import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import {
  getOnboardingState,
  updateSettingsProfile,
} from "@/lib/db/onboarding";
import { settingsProfilePayloadSchema } from "@/lib/validations/settings";

export async function GET() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getOnboardingState(user.id);
  return NextResponse.json(state);
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

  const parsed = settingsProfilePayloadSchema.safeParse(json);
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

  const displayName = parsed.data.displayName?.trim() ?? "";

  await updateSettingsProfile(user.id, {
    displayName: displayName.length > 0 ? displayName : null,
    languages: parsed.data.languages,
  });

  const state = await getOnboardingState(user.id);
  return NextResponse.json(state);
}

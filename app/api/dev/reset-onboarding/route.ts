import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { resetOnboardingForDev } from "@/lib/db/onboarding";

function devOnlyResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

async function handleReset(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return devOnlyResponse();
  }

  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await resetOnboardingForDev(user.id);

  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/onboarding", url.origin).href);
}

export async function GET(request: Request) {
  return handleReset(request);
}

export async function POST(request: Request) {
  return handleReset(request);
}

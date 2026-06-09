import { NextResponse } from "next/server";

import { DEV_ACCOUNT_PREVIEW_COOKIE } from "@/lib/dev/preview-account";

function devOnlyResponse() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return devOnlyResponse();
  }

  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/login", url.origin).href);
  response.cookies.set(DEV_ACCOUNT_PREVIEW_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}

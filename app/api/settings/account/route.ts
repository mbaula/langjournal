import { NextResponse } from "next/server";

import { getAuthenticatedAppUser } from "@/lib/auth/api-user";
import { deleteUserAccount } from "@/lib/db/delete-account";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const user = await getAuthenticatedAppUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: "Account deletion is temporarily unavailable." },
        { status: 503 },
      );
    }

    await deleteUserAccount(user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("Failed to delete Supabase auth user:", error.message);
      return NextResponse.json(
        { error: "Could not fully delete account. Please contact support." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json(
      { error: "Could not delete account" },
      { status: 500 },
    );
  }
}

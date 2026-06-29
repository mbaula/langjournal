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
    await deleteUserAccount(user.id);

    const admin = createAdminClient();
    if (admin) {
      const { error: authError } = await admin.auth.admin.deleteUser(user.id);
      if (authError) {
        console.warn("Could not delete Supabase auth user:", authError.message);
      }
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

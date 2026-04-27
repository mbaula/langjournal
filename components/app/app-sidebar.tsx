import { requireUser } from "@/lib/auth/session";
import { listJournalRecentsForSidebar } from "@/lib/entries/service";
import { bodySnippetForSidebar } from "@/lib/text/entry-sidebar-preview";

import { AppSidebarClient } from "./app-sidebar-client";

export async function AppSidebar() {
  const user = await requireUser();
  const entries = await listJournalRecentsForSidebar(user.id);
  const recents = entries.map((e) => {
    const title = e.title?.trim() ? e.title.trim() : null;
    return {
      id: e.id,
      title,
      bodyPreview: title ? "" : bodySnippetForSidebar(e.body),
    };
  });

  return (
    <AppSidebarClient userEmail={user.email} recents={recents} />
  );
}

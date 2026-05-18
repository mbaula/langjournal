import { requireUser } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";
import { listJournalRecentsForSidebar } from "@/lib/entries/service";
import { bodySnippetForSidebar } from "@/lib/text/entry-sidebar-preview";

import { AppSidebarClient } from "./app-sidebar-client";

export async function AppSidebar() {
  const user = await requireUser();
  const [entries, onboarding] = await Promise.all([
    listJournalRecentsForSidebar(user.id),
    getOnboardingState(user.id),
  ]);
  const userLabel =
    onboarding.displayName?.trim() || user.email.trim() || "Account";
  const recents = entries.map((e) => {
    const title = e.title?.trim() ? e.title.trim() : null;
    return {
      id: e.id,
      title,
      entryDate: e.entryDate.toISOString(),
      bodyPreview: title ? "" : bodySnippetForSidebar(e.body),
    };
  });

  return (
    <AppSidebarClient userLabel={userLabel} recents={recents} />
  );
}

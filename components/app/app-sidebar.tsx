import { requireUser } from "@/lib/auth/session";
import { listJournalEntries } from "@/lib/entries/service";

import { AppSidebarClient } from "./app-sidebar-client";

function formatEntryDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export async function AppSidebar() {
  const user = await requireUser();
  const entries = await listJournalEntries(user.id);
  const recents = entries.map((e) => ({
    id: e.id,
    title: e.title?.trim() ? e.title.trim() : null,
    dayLabel: formatEntryDay(e.entryDate),
  }));

  return (
    <AppSidebarClient userEmail={user.email} recents={recents} />
  );
}

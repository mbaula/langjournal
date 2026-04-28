"use client";

import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";

type AppLayoutClientProps = {
  children: React.ReactNode;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

export function AppLayoutClient({
  children,
  initialEntry,
  initialEntryId,
}: AppLayoutClientProps) {
  return (
    <EntryProvider initialEntry={initialEntry} initialEntryId={initialEntryId}>
      {children}
    </EntryProvider>
  );
}

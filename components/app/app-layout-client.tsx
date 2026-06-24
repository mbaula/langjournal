"use client";

import { DevAccountPreviewBanner } from "@/components/app/dev-account-preview-banner";
import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";

type AppLayoutClientProps = {
  topNav: React.ReactNode;
  children: React.ReactNode;
  accountPreview?: boolean;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

export function AppLayoutClient({
  topNav,
  children,
  accountPreview = false,
  initialEntry,
  initialEntryId,
}: AppLayoutClientProps) {
  return (
    <EntryProvider initialEntry={initialEntry} initialEntryId={initialEntryId}>
      <div className="flex min-h-dvh flex-col bg-background text-foreground transition-[background-color,color] duration-300 ease-out">
        <main className="flex min-h-dvh flex-1 flex-col bg-background transition-[background-color] duration-300 ease-out">
          {accountPreview ? <DevAccountPreviewBanner /> : null}
          {topNav}
          <div className="flex-1">
            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10 md:px-16 lg:px-20 lg:py-12">
              {children}
            </div>
          </div>
        </main>
      </div>
    </EntryProvider>
  );
}

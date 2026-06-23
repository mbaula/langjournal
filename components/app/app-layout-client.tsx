"use client";

import { DevAccountPreviewBanner } from "@/components/app/dev-account-preview-banner";
import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

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
      <div className="flex min-h-dvh flex-col bg-app-shell p-2 transition-[background-color,color] duration-300 ease-out max-lg:min-h-dvh max-lg:p-0">
        <main
          className={cn(
            "flex min-h-[calc(100dvh-1rem)] flex-1 flex-col rounded-xl bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] transition-[background-color,box-shadow] duration-300 ease-out",
            "max-lg:min-h-dvh max-lg:rounded-none max-lg:shadow-none",
          )}
        >
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

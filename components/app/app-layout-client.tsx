"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

type AppLayoutClientProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

export function AppLayoutClient({
  sidebar,
  children,
  initialEntry,
  initialEntryId,
}: AppLayoutClientProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <EntryProvider initialEntry={initialEntry} initialEntryId={initialEntryId}>
      <div className="flex min-h-full flex-1 bg-background transition-[background-color,color] duration-300 ease-out">
        <div
          className={cn(
            "overflow-hidden transition-[width,transform,opacity] duration-200 ease-out",
            sidebarCollapsed
              ? "pointer-events-none w-0 -translate-x-2 opacity-0"
              : "w-[240px] opacity-100",
          )}
          aria-hidden={sidebarCollapsed}
        >
          {sidebar}
        </div>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col transition-[background-color,color] duration-300 ease-out">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute top-3 left-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/95 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            )}
          </button>
          <main className="flex-1 overflow-auto transition-[background-color,color] duration-300 ease-out">
            <div className="mx-auto max-w-[900px] px-8 py-10 md:px-20 md:py-14 transition-[background-color,color] duration-300 ease-out">
              {children}
            </div>
          </main>
        </div>
      </div>
    </EntryProvider>
  );
}

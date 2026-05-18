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
      {/* Arc-style shell: bg-app-shell frame; main panel is bg-background (globals.css). */}
      <div className="flex h-dvh min-h-0 flex-1 gap-2 bg-app-shell p-2 transition-[background-color,color] duration-300 ease-out">
        <div
          className={cn(
            "flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width,transform,opacity] duration-200 ease-out",
            sidebarCollapsed
              ? "pointer-events-none w-0 -translate-x-2 opacity-0"
              : "w-[240px] opacity-100",
          )}
          aria-hidden={sidebarCollapsed}
        >
          {sidebar}
        </div>
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <button
            type="button"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="absolute top-4 left-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            )}
          </button>
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] transition-[background-color,border-color,box-shadow] duration-300 ease-out dark:border-border/60 dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.45)]">
            <div className="flex-1 overflow-auto">
              <div className="mx-auto max-w-[900px] px-8 py-10 md:px-20 md:py-14">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </EntryProvider>
  );
}

"use client";

import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

type AppLayoutClientProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

const MOBILE_QUERY = "(max-width: 1023px)";

export function AppLayoutClient({
  sidebar,
  children,
  initialEntry,
  initialEntryId,
}: AppLayoutClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const isJournalHome = pathname === "/app/journal";

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => {
      const mobile = mq.matches;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setMobileSidebarOpen((open) => !open);
      return;
    }
    setDesktopSidebarCollapsed((collapsed) => !collapsed);
  }, [isMobile]);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const sidebarExpanded = isMobile ? mobileSidebarOpen : !desktopSidebarCollapsed;

  return (
    <EntryProvider initialEntry={initialEntry} initialEntryId={initialEntryId}>
      <div className="flex h-dvh min-h-0 flex-1 gap-2 bg-app-shell p-2 transition-[background-color,color] duration-300 ease-out max-lg:gap-0 max-lg:p-0">
        {isMobile && mobileSidebarOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
            aria-label="Close navigation"
            onClick={closeMobileSidebar}
          />
        ) : null}

        <div
          className={cn(
            isMobile
              ? cn(
                  "fixed inset-y-0 left-0 z-50 flex h-dvh min-h-0 w-[min(100vw-3rem,280px)] flex-col overflow-hidden shadow-xl transition-transform duration-200 ease-out",
                  mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
                )
              : cn(
                  "flex h-full min-h-0 shrink-0 flex-col overflow-hidden transition-[width,transform,opacity] duration-200 ease-out",
                  desktopSidebarCollapsed
                    ? "pointer-events-none w-0 -translate-x-2 opacity-0"
                    : "w-[240px] opacity-100",
                ),
          )}
          aria-hidden={isMobile ? !mobileSidebarOpen : desktopSidebarCollapsed}
        >
          {sidebar}
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-2 border-b border-border/80 px-3 py-2 lg:hidden">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              aria-label={sidebarExpanded ? "Close navigation" : "Open navigation"}
              aria-expanded={sidebarExpanded}
            >
              <Menu className="size-5" strokeWidth={1.75} />
            </button>
            <span className="font-[family-name:var(--font-folio)] text-base font-semibold tracking-[-0.02em] text-foreground">
              Folio
            </span>
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute top-4 left-4 z-20 hidden size-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:inline-flex"
            aria-label={
              desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopSidebarCollapsed ? (
              <ChevronRight className="size-4" strokeWidth={1.75} />
            ) : (
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            )}
          </button>

          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/80 bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] transition-[background-color,border-color,box-shadow] duration-300 ease-out dark:border-border/60 dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.45)]",
              "max-lg:rounded-none max-lg:border-x-0 max-lg:shadow-none",
            )}
          >
            <div className="flex-1 overflow-auto overscroll-contain">
              <div
                className={cn(
                  "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 md:px-12 md:py-14 lg:px-16 lg:py-14 lg:pt-14",
                  isJournalHome ? "max-w-[1200px]" : "max-w-[900px]",
                )}
              >
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </EntryProvider>
  );
}

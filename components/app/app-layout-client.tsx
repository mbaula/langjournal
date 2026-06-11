"use client";

import { ChevronsRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { DevAccountPreviewBanner } from "@/components/app/dev-account-preview-banner";
import { SidebarShellProvider } from "@/components/app/sidebar-shell-context";
import { EntryProvider, type JournalEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

type AppLayoutClientProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  accountPreview?: boolean;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

const MOBILE_QUERY = "(max-width: 1023px)";

export function AppLayoutClient({
  sidebar,
  children,
  accountPreview = false,
  initialEntry,
  initialEntryId,
}: AppLayoutClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const pathname = usePathname();

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
      <SidebarShellProvider
        value={{ isMobile, sidebarExpanded, toggleSidebar }}
      >
        <div className="flex min-h-dvh flex-1 gap-2 bg-app-shell p-2 transition-[background-color,color] duration-300 ease-out max-lg:min-h-dvh max-lg:gap-0 max-lg:p-0">
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
                  "sticky top-2 z-30 flex h-[calc(100dvh-1rem)] min-h-0 shrink-0 flex-col self-start overflow-hidden transition-[width,transform,opacity] duration-200 ease-out",
                  desktopSidebarCollapsed
                    ? "pointer-events-none w-0 -translate-x-2 opacity-0"
                    : "w-[240px] opacity-100",
                ),
          )}
          aria-hidden={isMobile ? !mobileSidebarOpen : desktopSidebarCollapsed}
        >
          {sidebar}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
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
            className={cn(
              "absolute top-4 left-4 z-20 hidden size-11 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:inline-flex",
              !desktopSidebarCollapsed && "lg:hidden",
            )}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronsRight className="size-4" strokeWidth={1.75} />
          </button>

          <main
            className={cn(
              "flex min-h-[calc(100dvh-1rem)] flex-1 flex-col rounded-xl border border-border/80 bg-background shadow-[0_2px_12px_-4px_rgba(0,0,0,0.12)] transition-[background-color,border-color,box-shadow] duration-300 ease-out",
              "max-lg:min-h-dvh max-lg:rounded-none max-lg:border-x-0 max-lg:shadow-none",
            )}
          >
            {accountPreview ? <DevAccountPreviewBanner /> : null}
            <div className="flex-1">
              <div
                className={cn(
                  "mx-auto w-full max-w-[1200px] px-6 pt-10 pb-6 sm:px-8 sm:pt-12 sm:pb-8 md:px-16 md:pt-20 md:pb-14 lg:px-20 lg:pt-24 lg:pb-14",
                )}
              >
                {children}
              </div>
            </div>
          </main>
        </div>
        </div>
      </SidebarShellProvider>
    </EntryProvider>
  );
}

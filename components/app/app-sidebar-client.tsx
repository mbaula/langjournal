"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  ChevronDown,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react";

import { useEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

export type RecentEntry = {
  id: string;
  title: string | null;
  dayLabel: string;
};

type AppSidebarClientProps = {
  userEmail: string;
  recents: RecentEntry[];
};

function formatDefaultTitle(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function AppSidebarClient({
  userEmail,
  recents,
}: AppSidebarClientProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { switchEntry } = useEntry();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newEntryPending, setNewEntryPending] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userMenuRef.current?.contains(e.target as Node)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  const createEntry = useCallback(async () => {
    if (newEntryPending) return;
    setNewEntryPending(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formatDefaultTitle() }),
      });
      const data = (await res.json()) as { entry?: { id: string } };
      if (data.entry?.id) {
        switchEntry(data.entry.id);
      }
    } finally {
      setNewEntryPending(false);
    }
  }, [newEntryPending, switchEntry]);

  const toggleColorMode = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const journalActive =
    pathname === "/app/journal" || pathname.startsWith("/app/entry");

  const displayUser = userEmail.trim() || "Account";

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-sidebar-border border-r bg-sidebar text-sidebar-foreground transition-[background-color,border-color,color] duration-300 ease-out">
      <div
        className="relative border-sidebar-border border-b px-2 py-2"
        ref={userMenuRef}
      >
        <button
          type="button"
          onClick={() => setUserMenuOpen((o) => !o)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
          aria-expanded={userMenuOpen}
          aria-haspopup="menu"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{displayUser}</p>
          </div>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 opacity-60 transition-transform",
              userMenuOpen && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </button>
        {userMenuOpen ? (
          <div
            className="absolute top-full right-2 left-2 z-50 mt-1 rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
            role="menu"
          >
            <Link
              href="/app/settings"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-muted"
              onClick={() => setUserMenuOpen(false)}
            >
              <Settings className="size-4 opacity-70" strokeWidth={1.75} />
              Settings
            </Link>
            <Link
              href="/auth/signout"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-muted"
              onClick={() => setUserMenuOpen(false)}
            >
              <LogOut className="size-4 opacity-70" strokeWidth={1.75} />
              Sign out
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2 py-2">
        <div className="shrink-0 space-y-1">
          <button
            type="button"
            disabled={newEntryPending}
            onClick={() => void createEntry()}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors",
              "hover:bg-sidebar-accent",
              newEntryPending && "opacity-60",
            )}
          >
            <Plus className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            {newEntryPending ? "Opening…" : "New entry"}
          </button>

          <button
            type="button"
            onClick={toggleColorMode}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-sidebar-accent"
            aria-label={
              mounted && resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <>
                  <Sun
                    className="size-4 shrink-0 opacity-70"
                    strokeWidth={1.75}
                  />
                  Light mode
                </>
              ) : (
                <>
                  <Moon
                    className="size-4 shrink-0 opacity-70"
                    strokeWidth={1.75}
                  />
                  Dark mode
                </>
              )
            ) : (
              <>
                <Moon
                  className="size-4 shrink-0 opacity-70"
                  strokeWidth={1.75}
                />
                Theme
              </>
            )}
          </button>

          <Link
            href="/app/journal"
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
              journalActive
                ? "bg-sidebar-accent font-medium"
                : "hover:bg-sidebar-accent/80",
            )}
          >
            <BookOpen className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            Journal
          </Link>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <p className="shrink-0 px-2 pb-2 text-[11px] text-muted-foreground font-semibold tracking-wide uppercase">
            Recents
          </p>
          {recents.length === 0 ? (
            <p className="shrink-0 px-2 text-[12px] text-muted-foreground leading-snug">
              No entries yet.
            </p>
          ) : (
            <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain pr-0.5">
              {recents.map((entry) => {
                const active = pathname === `/app/entry/${entry.id}`;
                const primary = entry.title?.trim() || entry.dayLabel;
                const subtitle = entry.title?.trim() ? entry.dayLabel : null;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => switchEntry(entry.id)}
                      title={
                        subtitle
                          ? `${entry.title} · ${entry.dayLabel}`
                          : primary
                      }
                      className={cn(
                        "block w-full text-left rounded-md px-2 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium"
                          : "hover:bg-sidebar-accent/80",
                      )}
                    >
                      <span className="block truncate">{primary}</span>
                      {subtitle ? (
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {subtitle}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

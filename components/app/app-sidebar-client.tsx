"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Home, LogOut, Plus, Settings } from "lucide-react";

import { CustomizeMenu } from "@/components/app/customize-menu";
import { sidebarNavItemClass } from "@/components/app/sidebar-nav-styles";
import { SidebarRecentEntryItem } from "@/components/app/sidebar-recent-entry-item";
import type { RecentEntry } from "@/components/app/recent-entry";
import { useEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

export type { RecentEntry };

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

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function AppSidebarClient({
  userEmail,
  recents: initialRecents,
}: AppSidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentEntryId, switchEntry, prefetchEntry } = useEntry();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [newEntryPending, setNewEntryPending] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [recents, setRecents] = useState(initialRecents);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [renameEntryId, setRenameEntryId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamePending, setRenamePending] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecents(initialRecents);
  }, [initialRecents]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (userMenuRef.current?.contains(e.target as Node)) return;
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [userMenuOpen]);

  useEffect(() => {
    if (renameEntryId) {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }
  }, [renameEntryId]);

  const openTodayEntry = useCallback(async () => {
    if (newEntryPending) return;

    const todayEntry = recents.find((entry) =>
      isSameUtcDay(new Date(entry.entryDate), new Date()),
    );
    if (todayEntry) {
      void switchEntry(todayEntry.id);
      return;
    }

    setNewEntryPending(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formatDefaultTitle() }),
      });
      const data = (await res.json()) as { entry?: { id: string } };
      const createdEntryId = data.entry?.id;
      if (createdEntryId) {
        setRecents((prev) => {
          if (prev.some((entry) => entry.id === createdEntryId)) {
            return prev;
          }

          return [
            {
              id: createdEntryId,
              title: formatDefaultTitle(),
              entryDate: new Date().toISOString(),
              bodyPreview: "",
            },
            ...prev,
          ];
        });
        void switchEntry(createdEntryId);
      }
    } finally {
      setNewEntryPending(false);
    }
  }, [newEntryPending, recents, switchEntry]);

  const handleRenameStart = useCallback((entryId: string) => {
    const entry = initialRecents.find((e) => e.id === entryId);
    setRenameEntryId(entryId);
    setRenameValue(entry?.title ?? "");
  }, [initialRecents]);

  const handleRenameCancel = useCallback(() => {
    setRenameEntryId(null);
    setRenameValue("");
  }, []);

  const handleRenameSave = useCallback(async () => {
    if (!renameEntryId || renamePending) return;

    setRenamePending(true);
    try {
      const res = await fetch(`/api/entries/${renameEntryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      if (res.ok) {
        setRecents((prev) =>
          prev.map((e) =>
            e.id === renameEntryId
              ? { ...e, title: renameValue.trim() || null }
              : e,
          ),
        );
        router.refresh();
      }
    } finally {
      setRenamePending(false);
      setRenameEntryId(null);
      setRenameValue("");
    }
  }, [renameEntryId, renameValue, renamePending, router]);

  const handleDeleteStart = useCallback((entryId: string) => {
    setDeleteConfirm(entryId);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm || deletePending) return;

    setDeletePending(true);
    try {
      const res = await fetch(`/api/entries/${deleteConfirm}`, {
        method: "DELETE",
      });
      if (res.ok || res.status === 404) {
        setRecents((prev) => prev.filter((e) => e.id !== deleteConfirm));
        if (pathname === `/app/entry/${deleteConfirm}`) {
          router.push("/app/journal");
        }
        router.refresh();
      }
    } finally {
      setDeletePending(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deletePending, pathname, router]);

  const handleOpenEntry = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, entryId: string) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      void switchEntry(entryId);
    },
    [switchEntry],
  );

  const handlePrefetchEntry = useCallback(
    (entryId: string) => {
      void prefetchEntry(entryId);
    },
    [prefetchEntry],
  );

  const journalActive = pathname === "/app/journal";
  const displayUser = userEmail.trim() || "Account";
  const hasTodayEntry = recents.some((entry) =>
    isSameUtcDay(new Date(entry.entryDate), new Date()),
  );
  const pathnameEntryId = pathname.match(/^\/app\/entry\/([^/]+)$/)?.[1] ?? null;
  const activeEntryId = currentEntryId ?? pathnameEntryId;

  return (
    <aside className="flex h-full min-h-0 w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[background-color,color] duration-300 ease-out">
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
        <div className="shrink-0 space-y-2">
          <Link
            href="/app/journal"
            suppressHydrationWarning
            className={sidebarNavItemClass(journalActive)}
          >
            <Home className="size-4 shrink-0" strokeWidth={1.75} />
            Home
          </Link>

          <CustomizeMenu />

          <button
            type="button"
            disabled={newEntryPending}
            onClick={() => void openTodayEntry()}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent/80",
              newEntryPending && "opacity-60",
            )}
          >
            <Plus className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            {newEntryPending
              ? "Opening…"
              : hasTodayEntry
                ? "Open today's entry"
                : "New entry"}
          </button>
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
            <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
              {recents.map((entry) => {
                const isActive = activeEntryId === entry.id;
                const isDeleting = deleteConfirm === entry.id;
                const isRenaming = renameEntryId === entry.id;

                if (isDeleting) {
                  return (
                    <li
                      key={entry.id}
                      className="rounded-md border border-border bg-popover px-2 py-1.5 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] text-muted-foreground">
                          Delete this entry?
                        </span>
                      </div>
                      <div className="mt-1 flex justify-end gap-1">
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          disabled={deletePending}
                          onClick={handleDeleteCancel}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="rounded px-2 py-1 text-[12px] text-destructive transition-colors hover:bg-destructive/10"
                          disabled={deletePending}
                          onClick={() => void handleDeleteConfirm()}
                        >
                          {deletePending ? "…" : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                }

                if (isRenaming) {
                  return (
                    <li key={entry.id} className="px-1">
                      <input
                        ref={renameInputRef}
                        type="text"
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[13px] text-foreground outline-none focus:border-ring"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            void handleRenameSave();
                          } else if (e.key === "Escape") {
                            handleRenameCancel();
                          }
                        }}
                        onBlur={() => void handleRenameSave()}
                        disabled={renamePending}
                        placeholder="Entry title..."
                      />
                    </li>
                  );
                }

                return (
                  <SidebarRecentEntryItem
                    key={entry.id}
                    {...entry}
                    active={isActive}
                    onOpenEntry={handleOpenEntry}
                    onPrefetchEntry={handlePrefetchEntry}
                    onRenameTitle={handleRenameStart}
                    onDelete={handleDeleteStart}
                  />
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

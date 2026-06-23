"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronsLeft, Home, Layers, LogOut, Plus, Settings, TrendingUp, User } from "lucide-react";

import { CustomizeMenu } from "@/components/app/customize-menu";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { SidebarBrandFooter } from "@/components/app/sidebar-brand-footer";
import { useSidebarShell } from "@/components/app/sidebar-shell-context";
import { sidebarNavItemClass } from "@/components/app/sidebar-nav-styles";
import { SidebarRecentEntryItem } from "@/components/app/sidebar-recent-entry-item";
import type { RecentEntry } from "@/components/app/recent-entry";
import { useEntry } from "@/lib/entries/entry-context";
import { cn } from "@/lib/utils";

export type { RecentEntry };

type AppSidebarClientProps = {
  userLabel: string;
  recents: RecentEntry[];
  previewMode?: boolean;
};

function formatDefaultTitle(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function profilePlaceholderInitials(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed || trimmed === "Account") return null;
  if (trimmed.includes("@")) return trimmed[0]?.toUpperCase() ?? null;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function AppSidebarClient({
  userLabel,
  recents: initialRecents,
  previewMode = false,
}: AppSidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarShell = useSidebarShell();
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
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    setShellReady(true);
  }, []);

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

  const createNewEntry = useCallback(async () => {
    if (newEntryPending) return;

    if (previewMode) {
      router.push("/app/journal");
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
  }, [newEntryPending, previewMode, router, switchEntry]);

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
    (event: React.MouseEvent<HTMLAnchorElement>, _entryId: string) => {
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
      if (previewMode) {
        router.push("/app/journal");
        return;
      }
      void switchEntry(_entryId);
    },
    [previewMode, router, switchEntry],
  );

  const handlePrefetchEntry = useCallback(
    (entryId: string) => {
      if (previewMode) return;
      void prefetchEntry(entryId);
    },
    [prefetchEntry, previewMode],
  );

  const journalActive = pathname === "/app/journal";
  const progressActive = pathname.startsWith("/app/progress");
  const flashcardsActive = pathname.startsWith("/app/flashcards");
  const displayUser = userLabel.trim() || "Account";
  const profileInitials = profilePlaceholderInitials(displayUser);
  const pathnameEntryId = pathname.match(/^\/app\/entry\/([^/]+)$/)?.[1] ?? null;
  const activeEntryId = currentEntryId ?? pathnameEntryId;

  useEffect(() => {
    router.prefetch("/app/journal");
    router.prefetch("/app/progress");
    router.prefetch("/app/flashcards");
  }, [router]);

  return (
    <aside className="flex h-full min-h-0 w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[background-color,color] duration-300 ease-out">
      <div className="flex items-center justify-between gap-3 border-sidebar-border border-b px-2 py-2">
        <div className="relative min-w-0" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="inline-flex max-w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent"
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
          >
            <span className="inline-flex min-w-0 items-center gap-2.5">
              <div
                className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sidebar-border/80 bg-sidebar-accent text-[11px] font-medium text-sidebar-foreground/85"
                aria-hidden
              >
                {profileInitials ? (
                  <span>{profileInitials}</span>
                ) : (
                  <User className="size-4 opacity-70" strokeWidth={1.75} />
                )}
              </div>
              <span className="max-w-[7.5rem] truncate text-[13px] font-medium">
                {displayUser}
              </span>
            </span>
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
              className="absolute top-full left-0 z-50 mt-1 min-w-[12rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
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
              href={
                previewMode
                  ? "/api/dev/exit-account-preview"
                  : "/auth/signout"
              }
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-muted"
              onClick={() => setUserMenuOpen(false)}
            >
              <LogOut className="size-4 opacity-70" strokeWidth={1.75} />
              {previewMode ? "Exit preview" : "Sign out"}
            </Link>
          </div>
        ) : null}
        </div>

        {shellReady &&
        sidebarShell &&
        !sidebarShell.isMobile &&
        sidebarShell.sidebarExpanded ? (
          <button
            type="button"
            onClick={sidebarShell.toggleSidebar}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronsLeft className="size-4" strokeWidth={1.75} />
          </button>
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

          <Link
            href="/app/progress"
            suppressHydrationWarning
            className={sidebarNavItemClass(progressActive)}
          >
            <TrendingUp className="size-4 shrink-0" strokeWidth={1.75} />
            Progress
          </Link>

          <Link
            href="/app/flashcards"
            suppressHydrationWarning
            className={sidebarNavItemClass(flashcardsActive)}
          >
            <Layers className="size-4 shrink-0" strokeWidth={1.75} />
            Practice
          </Link>

          <CustomizeMenu />

          <button
            type="button"
            disabled={newEntryPending}
            onClick={() => void createNewEntry()}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-[13px] transition-colors sm:py-1.5",
              "text-sidebar-foreground hover:bg-sidebar-accent/80",
              newEntryPending && "opacity-60",
            )}
          >
            <Plus className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            {newEntryPending ? "Creating…" : "New entry"}
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
                    onRenameTitle={previewMode ? undefined : handleRenameStart}
                    onDelete={previewMode ? undefined : handleDeleteStart}
                  />
                );
              })}
            </ul>
          )}
          <FeedbackButton variant="sidebar" className="mt-3 shrink-0" />
        </div>
      </div>

      <SidebarBrandFooter />
    </aside>
  );
}

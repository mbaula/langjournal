"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type DeleteEntryResult =
  | { ok: true }
  | { ok: false; error: string };

export type EntryActionsMenuProps = {
  entryId: string;
  onRenameTitle?: (entryId: string) => void;
  /** Called after the user confirms delete in the menu. */
  onDeleteConfirm?: (entryId: string) => Promise<DeleteEntryResult>;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  openTriggerClassName?: string;
};

export function EntryActionsMenu({
  entryId,
  onRenameTitle,
  onDeleteConfirm,
  onOpenChange,
  className,
  triggerClassName,
  openTriggerClassName,
}: EntryActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      onOpenChange?.(open);
      if (!open) {
        setDeleteConfirming(false);
        setDeleteError(null);
      }
    },
    [onOpenChange],
  );

  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

  const startDeleteConfirm = useCallback(() => {
    setDeleteConfirming(true);
    setDeleteError(null);
  }, []);

  const cancelDeleteConfirm = useCallback(() => {
    setDeleteConfirming(false);
    setDeleteError(null);
  }, []);

  const performDelete = useCallback(async () => {
    if (deletePending || !onDeleteConfirm) {
      return;
    }

    setDeletePending(true);
    setDeleteError(null);
    try {
      const result = await onDeleteConfirm(entryId);
      if (result.ok) {
        closeMenu();
      } else {
        setDeleteError(result.error);
      }
    } catch {
      setDeleteError("Something went wrong");
    } finally {
      setDeletePending(false);
    }
  }, [closeMenu, deletePending, entryId, onDeleteConfirm]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, setOpen]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative flex shrink-0 items-center pr-1 transition-opacity",
        "opacity-0 pointer-events-none",
        "max-lg:opacity-100 max-lg:pointer-events-auto",
        "lg:group-hover/entry:opacity-100 lg:group-hover/entry:pointer-events-auto",
        "lg:group-focus-within/entry:opacity-100 lg:group-focus-within/entry:pointer-events-auto",
        menuOpen && "opacity-100 pointer-events-auto",
        className,
      )}
    >
      <button
        type="button"
        suppressHydrationWarning
        className={cn(
          "flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors sm:size-8",
          "hover:bg-muted hover:text-foreground",
          menuOpen && "bg-muted text-foreground",
          triggerClassName,
          menuOpen && openTriggerClassName,
        )}
        aria-label="Entry actions"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!menuOpen);
        }}
      >
        <MoreVertical className="size-4" strokeWidth={1.5} />
      </button>
      {menuOpen ? (
        <div
          className="absolute top-full right-0 z-50 mt-0.5 min-w-[10rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {deleteConfirming ? (
            <div className="px-3 py-2">
              <p className="text-sm text-muted-foreground">Delete this entry?</p>
              <div className="mt-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={deletePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelDeleteConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-sm text-destructive transition-colors hover:bg-destructive/10"
                  disabled={deletePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void performDelete()}
                >
                  {deletePending ? "…" : "Delete"}
                </button>
              </div>
              {deleteError ? (
                <p className="mt-2 text-right text-xs text-destructive" role="alert">
                  {deleteError}
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-muted"
                onClick={() => {
                  onRenameTitle?.(entryId);
                  closeMenu();
                }}
              >
                <Pencil className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                Rename title
              </button>
              {onDeleteConfirm ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-destructive transition-colors hover:bg-muted"
                  onClick={startDeleteConfirm}
                >
                  <Trash2 className="size-4 shrink-0 opacity-70" strokeWidth={1.5} />
                  Delete entry
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

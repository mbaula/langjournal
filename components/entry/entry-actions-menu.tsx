"use client";

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type EntryActionsMenuProps = {
  entryId: string;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  triggerClassName?: string;
  openTriggerClassName?: string;
};

export function EntryActionsMenu({
  entryId,
  onRenameTitle,
  onDelete,
  onOpenChange,
  className,
  triggerClassName,
  openTriggerClassName,
}: EntryActionsMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const setOpen = useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const closeMenu = useCallback(() => setOpen(false), [setOpen]);

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
        "group-hover/row:opacity-100 group-hover/row:pointer-events-auto",
        "group-focus-within/row:opacity-100 group-focus-within/row:pointer-events-auto",
        menuOpen && "opacity-100 pointer-events-auto",
        className,
      )}
    >
      <button
        type="button"
        suppressHydrationWarning
        className={cn(
          "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors",
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
        <MoreVertical className="size-4" strokeWidth={1.75} />
      </button>
      {menuOpen ? (
        <div
          className="absolute top-full right-0 z-50 mt-0.5 min-w-[10rem] rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors hover:bg-muted"
            onClick={() => {
              onRenameTitle?.(entryId);
              closeMenu();
            }}
          >
            <Pencil className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            Rename title
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-destructive transition-colors hover:bg-muted"
            onClick={() => {
              onDelete?.(entryId);
              closeMenu();
            }}
          >
            <Trash2 className="size-4 shrink-0 opacity-70" strokeWidth={1.75} />
            Delete entry
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import type { RecentEntry } from "@/components/app/recent-entry";
import { sidebarNavRowSelectedClass } from "@/components/app/sidebar-nav-styles";
import { cn } from "@/lib/utils";

export type SidebarRecentEntryItemProps = RecentEntry & {
  active: boolean;
  onOpenEntry?: (event: React.MouseEvent<HTMLAnchorElement>, entryId: string) => void;
  onPrefetchEntry?: (entryId: string) => void;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function SidebarRecentEntryItem({
  id,
  title: entryTitle,
  bodyPreview,
  active,
  onOpenEntry,
  onPrefetchEntry,
  onRenameTitle,
  onDelete,
}: SidebarRecentEntryItemProps) {
  const href = `/app/entry/${id}`;

  const primary = entryTitle?.trim() || bodyPreview;

  return (
    <li
      suppressHydrationWarning
      className={cn(
        "group/row flex min-w-0 items-stretch rounded-md",
        active && sidebarNavRowSelectedClass,
      )}
    >
      <Link
        href={href}
        title={primary.length > 0 ? primary : undefined}
        suppressHydrationWarning
        onClick={(event) => onOpenEntry?.(event, id)}
        onMouseEnter={() => onPrefetchEntry?.(id)}
        onFocus={() => onPrefetchEntry?.(id)}
        className={cn(
          "peer min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-[13px] transition-colors",
          active && "font-medium",
          !active && "hover:bg-sidebar-accent/80",
        )}
      >
        <span className="block truncate">{primary}</span>
      </Link>
      <EntryActionsMenu
        entryId={id}
        onRenameTitle={onRenameTitle}
        onDelete={onDelete}
        triggerClassName={cn(
          active
            ? "text-sidebar-primary-foreground/75 hover:bg-sidebar-primary-foreground/10 hover:text-sidebar-primary-foreground peer-hover:bg-sidebar-primary-foreground/10"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground peer-hover:bg-sidebar-accent/80 hover:bg-sidebar-accent/80",
        )}
        openTriggerClassName={
          active ? "bg-sidebar-primary-foreground/15" : "bg-sidebar-accent/80"
        }
      />
    </li>
  );
}

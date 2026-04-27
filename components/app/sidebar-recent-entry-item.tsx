"use client";

import Link from "next/link";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import type { RecentEntry } from "@/components/app/recent-entry";
import { cn } from "@/lib/utils";

export type SidebarRecentEntryItemProps = RecentEntry & {
  active: boolean;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function SidebarRecentEntryItem({
  id,
  title: entryTitle,
  bodyPreview,
  active,
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
        active &&
          "bg-background border border-border shadow-sm dark:bg-sidebar-accent/60 dark:border-sidebar-border/70 dark:shadow-none",
      )}
    >
      <Link
        href={href}
        title={primary.length > 0 ? primary : undefined}
        suppressHydrationWarning
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
          "text-sidebar-foreground/70 hover:text-sidebar-foreground",
          // When hovering the entry (link) area, make kebab match it.
          "peer-hover:bg-sidebar-accent/80",
          // When hovering kebab only, only kebab gets a background.
          "hover:bg-sidebar-accent/80",
          // If selected, keep kebab consistent with the selected "card".
          active && "hover:bg-muted peer-hover:bg-muted",
        )}
        openTriggerClassName={active ? "bg-muted" : "bg-sidebar-accent/80"}
      />
    </li>
  );
}

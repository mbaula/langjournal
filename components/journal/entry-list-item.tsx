"use client";

import Link from "next/link";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { cn } from "@/lib/utils";

export type EntryListItemProps = {
  entryId: string;
  href: string;
  title: string | null;
  dateLabel: string;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function EntryListItem({
  entryId,
  href,
  title,
  dateLabel,
  onRenameTitle,
  onDelete,
}: EntryListItemProps) {
  const trimmed = title?.trim();

  return (
    <li className="group/row flex w-full min-w-0 items-stretch rounded-md">
      <Link
        href={href}
        className={cn(
          "min-w-0 flex-1 truncate rounded-md px-2 py-2 text-[14px] text-foreground transition-colors",
          "hover:bg-muted",
        )}
      >
        {trimmed ? (
          <>
            <span className="font-medium">{trimmed}</span>
            <span className="text-muted-foreground">
              {" "}
              · {dateLabel}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">{dateLabel}</span>
        )}
      </Link>
      <EntryActionsMenu
        entryId={entryId}
        onRenameTitle={onRenameTitle}
        onDelete={onDelete}
      />
    </li>
  );
}

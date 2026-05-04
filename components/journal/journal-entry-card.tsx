"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { journalTranslationHighlightClassName } from "@/components/journal/field-styles";
import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { segmentTranslatedLine } from "@/lib/entries/entry-body-segments";
import { useEntry } from "@/lib/entries/entry-context";
import type { InlineTranslation } from "@/lib/entries/translate";
import { cn } from "@/lib/utils";

function coalesceTranslations(raw: unknown): InlineTranslation[] {
  if (!Array.isArray(raw)) return [];
  const out: InlineTranslation[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "sourceText" in item &&
      "translatedText" in item
    ) {
      out.push(item as InlineTranslation);
    }
  }
  return out;
}

export type JournalEntryCardProps = {
  entryId: string;
  href: string;
  title: string | null;
  dateLabel: string;
  body: string | null;
  translations: unknown;
  onRenameTitle?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function JournalEntryCard({
  entryId,
  href,
  title,
  dateLabel,
  body,
  translations,
  onRenameTitle,
  onDelete,
}: JournalEntryCardProps) {
  const router = useRouter();
  const { removeEntryFromCache, updateEntryInCache } = useEntry();
  const [titleValue, setTitleValue] = useState<string | null>(title);
  const [renaming, setRenaming] = useState(false);
  const [renamePending, setRenamePending] = useState(false);
  const [renameValue, setRenameValue] = useState(title?.trim() ?? "");
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const trimmedTitle = titleValue?.trim();
  const displayTitle = trimmedTitle || dateLabel;
  const subtitle = trimmedTitle ? dateLabel : null;

  const startRename = useCallback(() => {
    setRenaming(true);
    setDeleteConfirming(false);
    const next = titleValue?.trim() ?? "";
    setRenameValue(next);
    queueMicrotask(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }, [titleValue]);

  const cancelRename = useCallback(() => {
    setRenaming(false);
    setRenamePending(false);
    setRenameValue(titleValue?.trim() ?? "");
  }, [titleValue]);

  const saveRename = useCallback(async () => {
    if (renamePending) return;
    const nextTitle = renameValue.trim();
    setRenamePending(true);
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle }),
      });
      if (res.ok) {
        const normalized = nextTitle.length ? nextTitle : null;
        setTitleValue(normalized);
        updateEntryInCache(entryId, { title: normalized });
        setRenaming(false);
        router.refresh();
      }
    } finally {
      setRenamePending(false);
    }
  }, [entryId, renamePending, renameValue, router, updateEntryInCache]);

  const startDelete = useCallback(() => {
    setDeleteConfirming(true);
    setRenaming(false);
  }, []);

  const performDelete = useCallback(async () => {
    if (deletePending) return;
    setDeletePending(true);
    try {
      const result = await deleteJournalEntryRequest(entryId);
      if (result.ok) {
        removeEntryFromCache(entryId);
        router.refresh();
      }
    } finally {
      setDeletePending(false);
      setDeleteConfirming(false);
    }
  }, [deletePending, entryId, removeEntryFromCache, router]);

  const text = body ?? "";
  const lines = text.split("\n");
  const segsList = useMemo(() => coalesceTranslations(translations), [translations]);
  const isEmptyBody =
    lines.length === 0 || (lines.length === 1 && !lines[0].trim());

  const Content = (
    <>
      <h2 className="text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
        {displayTitle}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      ) : null}
      <hr className="my-4 border-border" />
      <div className="flex flex-col gap-0">
        {isEmptyBody ? (
          <p className="text-[15px] leading-[1.65] text-muted-foreground/80">
            No text yet — open this entry to write.
          </p>
        ) : (
          lines.map((line, idx) => {
            const segs = segmentTranslatedLine(line, segsList);
            return (
              <p
                key={idx}
                className="min-h-[1.65em] whitespace-pre-wrap text-[15px] leading-[1.65] text-foreground"
              >
                {segs.map((seg, si) =>
                  seg.translation ? (
                    <span
                      key={si}
                      title={seg.translation.sourceText}
                      className={cn("cursor-default", journalTranslationHighlightClassName)}
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <span key={si}>{seg.text}</span>
                  ),
                )}
              </p>
            );
          })
        )}
      </div>
    </>
  );

  return (
    <li className="list-none">
      <div className="group/row flex gap-2 sm:gap-3">
        {renaming ? (
          <div
            className={cn(
              "min-w-0 flex-1 rounded-lg p-4 outline-none ring-offset-background transition-colors",
              "bg-muted/30",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveRename();
                  else if (e.key === "Escape") cancelRename();
                }}
                onBlur={() => void saveRename()}
                disabled={renamePending}
                placeholder="Entry title…"
                aria-label="Rename entry title"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none focus:border-ring"
              />
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={renamePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelRename}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-foreground transition-colors hover:bg-muted"
                  disabled={renamePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void saveRename()}
                >
                  {renamePending ? "…" : "Save"}
                </button>
              </div>
            </div>
            <div className="mt-4">{Content}</div>
          </div>
        ) : (
          <Link
            href={href}
            className={cn(
              "min-w-0 flex-1 rounded-lg p-4 outline-none ring-offset-background transition-colors",
              "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label={
              subtitle
                ? `Open entry to edit: ${displayTitle}, ${subtitle}`
                : `Open entry to edit: ${displayTitle}`
            }
          >
            {Content}
          </Link>
        )}
        <div className="shrink-0 pt-2">
          <EntryActionsMenu
            entryId={entryId}
            onRenameTitle={onRenameTitle ?? (() => startRename())}
            onDelete={onDelete ?? (() => startDelete())}
            triggerClassName="text-muted-foreground"
          />
          {deleteConfirming ? (
            <div className="mt-2 flex flex-col items-end gap-1 pr-1">
              <div className="rounded-md border border-border bg-popover px-2 py-1 text-[12px] text-muted-foreground shadow-sm">
                Delete this entry?
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={deletePending}
                  onClick={() => setDeleteConfirming(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-1 text-[12px] text-destructive transition-colors hover:bg-destructive/10"
                  disabled={deletePending}
                  onClick={() => void performDelete()}
                >
                  {deletePending ? "…" : "Delete"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

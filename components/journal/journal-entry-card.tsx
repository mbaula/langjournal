"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import {
  journalEntryPreviewTextClassName,
  journalTranslationHighlightClassName,
} from "@/components/journal/field-styles";
import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { segmentTranslatedLineBySpans } from "@/lib/entries/entry-body-segments";
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [previewClamped, setPreviewClamped] = useState(false);

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

  const syncPreviewClamp = useCallback(() => {
    const el = previewRef.current;
    if (!el || isEmptyBody) {
      setPreviewClamped(false);
      return;
    }
    setPreviewClamped(el.scrollHeight > el.clientHeight + 1);
  }, [isEmptyBody]);

  useLayoutEffect(() => {
    syncPreviewClamp();
  }, [body, translations, syncPreviewClamp]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || isEmptyBody) return;
    const observer = new ResizeObserver(() => syncPreviewClamp());
    observer.observe(el);
    return () => observer.disconnect();
  }, [body, isEmptyBody, syncPreviewClamp]);

  const entryHeader = (
    <>
      <h2 className="text-base font-semibold tracking-tight text-foreground">
        {displayTitle}
      </h2>
      {subtitle ? (
        <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>
      ) : null}
    </>
  );

  const entryBody = (
    <>
      <hr className="my-3 border-border" />
      <div ref={previewRef} className="relative max-h-36 overflow-hidden">
        <div className="flex flex-col gap-0">
          {isEmptyBody ? (
            <p
              className={cn(
                journalEntryPreviewTextClassName,
                "text-muted-foreground",
              )}
            >
              No text yet — open this entry to write.
            </p>
          ) : (
            lines.map((line, idx) => {
              const lineStart =
                idx === 0
                  ? 0
                  : lines.slice(0, idx).reduce((sum, l) => sum + l.length + 1, 0);
              const segs = segmentTranslatedLineBySpans(line, lineStart, segsList);
              return (
                <p
                  key={idx}
                  className={cn(
                    journalEntryPreviewTextClassName,
                    "min-h-[1.25em] whitespace-pre-wrap",
                  )}
                >
                  {segs.map((seg, si) =>
                    seg.translation ? (
                      <span
                        key={si}
                        title={seg.translation.sourceText}
                        className={cn(
                          "cursor-default",
                          journalTranslationHighlightClassName,
                        )}
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
        {previewClamped ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
    </>
  );

  return (
    <li className="list-none">
      <div className="group/row flex gap-2 sm:gap-3">
        {renaming ? (
          <div className="min-w-0 flex-1">
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
                  className="rounded-md px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={renamePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelRename}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-[12px] text-foreground transition-colors hover:bg-muted"
                  disabled={renamePending}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => void saveRename()}
                >
                  {renamePending ? "…" : "Save"}
                </button>
              </div>
            </div>
            <div className="mt-3">{entryBody}</div>
          </div>
        ) : (
          <Link
            href={href}
            className="min-w-0 flex-1 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={
              subtitle
                ? `Open entry to edit: ${displayTitle}, ${subtitle}`
                : `Open entry to edit: ${displayTitle}`
            }
          >
            {entryHeader}
            {entryBody}
          </Link>
        )}
        <div className="shrink-0 pt-0.5">
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
                  className="rounded-md px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  disabled={deletePending}
                  onClick={() => setDeleteConfirming(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-[12px] text-destructive transition-colors hover:bg-destructive/10"
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

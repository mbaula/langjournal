"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ExternalLink, Trash2 } from "lucide-react";

import { FlashcardAudioControls } from "@/components/flashcards/flashcard-audio-controls";
import type { CardLanguageView } from "@/components/flashcards/card-language-view-selector";
import { Button } from "@/components/ui/button";
import type { FlashcardRecord } from "@/lib/flashcards/types";
import { cn } from "@/lib/utils";

type IconHoverLabelProps = {
  label: string;
  children: ReactNode;
};

function IconHoverLabel({ label, children }: IconHoverLabelProps) {
  return (
    <span className="group/icon-label relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-0.5 text-xs font-medium text-background opacity-0 transition-opacity duration-75 group-hover/icon-label:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

type InlineEditableTextProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  muted?: boolean;
  editable?: boolean;
};

function InlineEditableText({
  value,
  onChange,
  className,
  muted = false,
  editable = false,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [editing, value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    } else {
      setDraft(value);
    }
  }, [draft, onChange, value]);

  if (!editable) {
    return (
      <span
        className={cn(
          "block whitespace-pre-wrap break-words",
          muted ? "text-muted-foreground" : "text-foreground",
          className,
        )}
      >
        {value}
      </span>
    );
  }

  if (editing) {
    return (
      <textarea
        ref={inputRef}
        rows={2}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "w-full min-w-0 resize-none rounded-sm border-0 bg-transparent p-0 text-center outline-none ring-0",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="textbox"
      tabIndex={0}
      onClick={(event) => {
        event.stopPropagation();
        setEditing(true);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          setEditing(true);
        }
      }}
      className={cn(
        "block cursor-text rounded-sm whitespace-pre-wrap break-words transition-colors hover:bg-muted/60",
        muted ? "text-muted-foreground" : "text-foreground",
        className,
      )}
    >
      {value}
    </span>
  );
}

export type FlashcardLibraryCardProps = {
  card: FlashcardRecord;
  cardLanguageView: CardLanguageView;
  expanded: boolean;
  deleteConfirming: boolean;
  previewMode?: boolean;
  onToggleExpand: () => void;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onDeleteRequest: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: () => void;
  onAudioChange: (hasAudio: boolean) => void;
};

export function FlashcardLibraryCard({
  card,
  cardLanguageView,
  expanded,
  deleteConfirming,
  previewMode = false,
  onToggleExpand,
  onPrimaryChange,
  onSecondaryChange,
  onDeleteRequest,
  onDeleteCancel,
  onDeleteConfirm,
  onAudioChange,
}: FlashcardLibraryCardProps) {
  const showBoth = cardLanguageView === "both";
  const showTranslationOnly = cardLanguageView === "translation";
  const showSecondary = showBoth || expanded;

  const primaryText = showTranslationOnly ? card.word : card.translation;
  const secondaryText = showTranslationOnly ? card.translation : card.word;

  const collapsedMinHeight = showBoth ? "min-h-[6.75rem]" : "min-h-[5.75rem]";

  const phraseContent = (
    <div className="flex flex-col items-center gap-[5px]">
      <InlineEditableText
        value={primaryText}
        onChange={onPrimaryChange}
        editable={expanded}
        className="text-base font-medium leading-snug"
      />
      {showSecondary ? (
        <InlineEditableText
          value={secondaryText}
          onChange={onSecondaryChange}
          editable={expanded}
          className="text-sm leading-snug"
          muted
        />
      ) : null}
    </div>
  );

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border border-border bg-card shadow-sm transition-[box-shadow,ring-color]",
        expanded
          ? "ring-2 ring-ring/30"
          : cn("group cursor-pointer hover:border-border hover:shadow-md", collapsedMinHeight),
      )}
      onClick={!expanded ? onToggleExpand : undefined}
      onKeyDown={
        !expanded
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onToggleExpand();
              }
            }
          : undefined
      }
      role={!expanded ? "button" : undefined}
      tabIndex={!expanded ? 0 : undefined}
      aria-expanded={expanded}
    >
      {expanded ? (
        <button
          type="button"
          aria-label="Collapse card"
          className="absolute top-2 right-2 z-10 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand();
          }}
        >
          <ChevronDown className="size-4 rotate-180 transition-transform" />
        </button>
      ) : null}

      {!expanded ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center px-3 py-3 text-center",
            collapsedMinHeight,
          )}
        >
          <div className="flex flex-col items-center transition-transform duration-100 ease-out group-hover:-translate-y-2">
            {phraseContent}
          </div>
          <p className="pointer-events-none absolute inset-x-3 bottom-2.5 text-xs text-muted-foreground opacity-0 transition-opacity duration-75 group-hover:opacity-100">
            click to view
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center px-3 py-3 text-center">
            {phraseContent}
          </div>

          <div
            className="border-t border-border px-3 py-3"
            onClick={(event) => event.stopPropagation()}
          >
            {deleteConfirming ? (
              <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-3">
                <p className="text-sm">Delete this flashcard?</p>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={onDeleteCancel}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={onDeleteConfirm}>
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <FlashcardAudioControls
                  flashcardId={card.id}
                  hasAudio={card.hasAudio}
                  disabled={previewMode}
                  className="min-w-0 flex-1"
                  onAudioChange={onAudioChange}
                />

                <div className="flex shrink-0 items-center gap-0.5">
                  {card.entryId ? (
                    <IconHoverLabel label="View entry">
                      <Link
                        href={`/app/journal?edit=${card.entryId}`}
                        aria-label="View entry"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <ExternalLink className="size-4" strokeWidth={1.5} />
                      </Link>
                    </IconHoverLabel>
                  ) : null}

                  <IconHoverLabel label="delete">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="delete"
                      className="size-9 shrink-0 text-destructive hover:bg-muted hover:text-destructive"
                      onClick={onDeleteRequest}
                    >
                      <Trash2 className="size-4" strokeWidth={1.5} />
                    </Button>
                  </IconHoverLabel>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}

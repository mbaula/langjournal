"use client";

import { useCallback, useRef, useState } from "react";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { journalWriteAreaShellClassName, journalWriteTitleClassName } from "@/components/journal/field-styles";
import {
  JournalEditor,
  type InlineTranslation,
  type JournalEditorHandle,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";
import { LanguageBar } from "@/components/journal/language-bar";
import { SaveEntryBar } from "@/components/journal/save-entry-bar";
import type { EntryRow } from "@/components/journal/entry-list";
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

type PastEntryEditorProps = {
  entry: EntryRow;
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
  onLanguagesSaved?: (source: string, target: string) => void;
  onSaved: (entry: EntryRow) => void;
  onDelete?: (entryId: string) => void;
};

export function PastEntryEditor({
  entry,
  sourceLanguage,
  targetLanguage,
  translateTrigger,
  onLanguagesSaved,
  onSaved,
  onDelete,
}: PastEntryEditorProps) {
  const editorRef = useRef<JournalEditorHandle>(null);
  const [entryTitle, setEntryTitle] = useState(entry.title?.trim() ?? "");
  const [draftBody, setDraftBody] = useState(entry.body ?? "");
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const initialTranslations = coalesceTranslations(entry.translations);

  const handleSave = useCallback(async () => {
    if (savePending) {
      return;
    }

    setSavePending(true);
    setSaveError(null);

    try {
      await editorRef.current?.flushSave();
      const draft = editorRef.current?.getDraftContent();

      onSaved({
        ...entry,
        title: entryTitle.trim() ? entryTitle.trim() : null,
        body: draft?.body ?? draftBody,
        translations: draft?.translations ?? initialTranslations,
        updatedAt: new Date(),
      });
    } catch {
      setSaveError("Couldn't save your entry. Try again.");
    } finally {
      setSavePending(false);
    }
  }, [draftBody, entry, entryTitle, initialTranslations, onSaved, savePending]);

  const canSave = Boolean(entryTitle.trim() || draftBody.trim());

  const handleDelete = useCallback(async () => {
    if (deletePending || !onDelete) {
      return;
    }

    setDeletePending(true);
    try {
      const result = await deleteJournalEntryRequest(entry.id);
      if (result.ok) {
        onDelete(entry.id);
      }
    } finally {
      setDeletePending(false);
      setDeleteConfirming(false);
    }
  }, [deletePending, entry.id, onDelete]);

  return (
    <div className={cn("group/entry", journalWriteAreaShellClassName)}>
      <div className="flex items-start justify-between gap-3">
        <LanguageBar
          source={sourceLanguage}
          target={targetLanguage}
          translateTrigger={translateTrigger}
          onLanguagesSaved={onLanguagesSaved}
        />
        {onDelete ? (
          <div className="relative shrink-0">
            <EntryActionsMenu
              entryId={entry.id}
              onRenameTitle={() => {
                const el = document.getElementById(`past-entry-title-${entry.id}`);
                if (el instanceof HTMLInputElement) {
                  el.focus();
                  el.select();
                }
              }}
              onDelete={() => setDeleteConfirming(true)}
              className="pointer-events-auto opacity-100"
              triggerClassName="text-muted-foreground"
            />
            {deleteConfirming ? (
              <div className="absolute right-0 top-full z-40 mt-2 min-w-[10rem] rounded-md border border-border bg-popover px-2 py-1 text-sm shadow-sm">
                <p className="text-muted-foreground">Delete this entry?</p>
                <div className="mt-1 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    disabled={deletePending}
                    onClick={() => setDeleteConfirming(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-1 text-destructive transition-colors hover:bg-destructive/10"
                    disabled={deletePending}
                    onClick={() => void handleDelete()}
                  >
                    {deletePending ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <EntryTitleField
          entryId={entry.id}
          initialTitle={entry.title}
          inputId={`past-entry-title-${entry.id}`}
          className={journalWriteTitleClassName}
          onTitleChange={setEntryTitle}
        />

        <JournalEditor
          ref={editorRef}
          entryId={entry.id}
          initialBody={entry.body ?? ""}
          initialTranslations={initialTranslations}
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          translateTrigger={translateTrigger}
          onBodyChange={setDraftBody}
          bodyMinHeightClassName="min-h-[16rem]"
          containerMinHeightClassName="min-h-[16rem]"
        />

        <SaveEntryBar
          canFinish={canSave}
          finishPending={savePending}
          successMessage={null}
          finishError={saveError}
          onFinish={handleSave}
        />
      </div>
    </div>
  );
}

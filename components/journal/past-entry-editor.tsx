"use client";

import { useCallback, useRef, useState } from "react";

import { EntryActionsMenu } from "@/components/entry/entry-actions-menu";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import { deleteJournalEntryRequest } from "@/components/journal/delete-entry-control";
import { journalPastEntryAreaShellClassName, journalWriteAreaShellClassName, journalWriteTitleClassName } from "@/components/journal/field-styles";
import { ListenButton } from "@/components/speech/listen-button";
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
  onDeleted?: (entryId: string) => void;
};

export function PastEntryEditor({
  entry,
  sourceLanguage,
  targetLanguage,
  translateTrigger,
  onLanguagesSaved,
  onSaved,
  onDeleted,
}: PastEntryEditorProps) {
  const editorRef = useRef<JournalEditorHandle>(null);
  const [entryTitle, setEntryTitle] = useState(entry.title?.trim() ?? "");
  const [draftBody, setDraftBody] = useState(entry.body ?? "");
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const confirmDelete = useCallback(async () => {
    const result = await deleteJournalEntryRequest(entry.id);
    if (result.ok) {
      onDeleted?.(entry.id);
    }
    return result;
  }, [entry.id, onDeleted]);

  return (
    <div className={cn("group/entry", journalPastEntryAreaShellClassName)}>
      <div className="flex items-start justify-between gap-3">
        <LanguageBar
          source={sourceLanguage}
          target={targetLanguage}
          translateTrigger={translateTrigger}
          onLanguagesSaved={onLanguagesSaved}
        />
        <div className="flex items-center gap-1">
          <ListenButton
            text={draftBody}
            languageCode={targetLanguage}
            label="Listen to entry"
          />
          {onDeleted ? (
            <EntryActionsMenu
              entryId={entry.id}
              onRenameTitle={() => {
                const el = document.getElementById(`past-entry-title-${entry.id}`);
                if (el instanceof HTMLInputElement) {
                  el.focus();
                  el.select();
                }
              }}
              onDeleteConfirm={confirmDelete}
              className="pointer-events-auto opacity-100"
              triggerClassName="text-muted-foreground"
            />
          ) : null}
        </div>
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

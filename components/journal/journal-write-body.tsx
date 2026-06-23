"use client";

import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { appPageShellClassName, journalWriteTitleClassName, journalWriteWorkspaceClassName } from "@/components/journal/field-styles";
import { DailyPromptCard } from "@/components/journal/daily-prompt-card";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import { type EntryRow } from "@/components/journal/entry-list";
import { PastEntriesSection } from "@/components/journal/past-entries-section";
import { JournalHomeHeader } from "@/components/journal/journal-home-header";
import {
  JournalEditor,
  type InlineTranslation,
  type JournalEditorHandle,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";
import type { DailyPromptState } from "@/lib/prompts/prompt-core";

type JournalWriteBodyProps = {
  greetingName: string;
  subtitle: string;
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
  entryId: string;
  initialTitle: string | null;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  pastEntries: EntryRow[];
  dailyPrompt?: DailyPromptState | null;
};

export type { JournalWriteBodyProps };

const FINISH_SUCCESS_MESSAGE =
  "Entry saved! Great job practicing your writing today.";

function PastEntriesScrollHint({
  visible,
  pastEntriesSectionRef,
}: {
  visible: boolean;
  pastEntriesSectionRef: React.RefObject<HTMLElement | null>;
}) {
  const [mounted, setMounted] = useState(false);
  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !visible) {
      return;
    }

    const section = pastEntriesSectionRef.current;
    if (!section) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowHint(!entry?.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [mounted, pastEntriesSectionRef, visible]);

  if (!mounted || !visible || !showHint) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-[30px] bottom-[max(30px,env(safe-area-inset-bottom))] z-30"
      aria-hidden
    >
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-[12px]">
        <ArrowDown className="size-3.5 shrink-0 sm:size-4" />
        <span className="leading-snug">Scroll down for past entries</span>
      </p>
    </div>
  );
}

function SaveEntryBar({
  anchorRef,
  canFinish,
  finishPending,
  successMessage,
  finishError,
  onFinish,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  canFinish: boolean;
  finishPending: boolean;
  successMessage: string | null;
  finishError: string | null;
  onFinish: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [alignLeft, setAlignLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const column = anchorRef.current;
    if (!column) {
      return;
    }

    const syncAlignLeft = () => {
      setAlignLeft(column.getBoundingClientRect().left);
    };

    syncAlignLeft();

    const resizeObserver = new ResizeObserver(syncAlignLeft);
    resizeObserver.observe(column);

    window.addEventListener("resize", syncAlignLeft);
    window.addEventListener("scroll", syncAlignLeft, { passive: true });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", syncAlignLeft);
      window.removeEventListener("scroll", syncAlignLeft);
    };
  }, [anchorRef, mounted]);

  if (!mounted) {
    return null;
  }

  if (!canFinish && !successMessage && !finishError) {
    return null;
  }

  const pillClassName =
    "h-10 rounded-full border border-border bg-white px-5 text-[13px] shadow-none hover:bg-white/90 dark:bg-background dark:hover:bg-background/90";

  return (
    <div
      className="pointer-events-none fixed bottom-[max(30px,env(safe-area-inset-bottom))] z-30 flex flex-col items-start gap-2"
      style={{ left: alignLeft }}
    >
      {successMessage ? (
        <p
          className="pointer-events-auto max-w-xs rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[13px] leading-snug text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}
      {finishError ? (
        <p
          className="pointer-events-auto max-w-xs rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-[13px] leading-snug text-destructive"
          role="alert"
        >
          {finishError}
        </p>
      ) : null}
      {canFinish ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={finishPending}
          className={`pointer-events-auto ${pillClassName}`}
          onClick={() => void onFinish()}
        >
          Save entry
        </Button>
      ) : null}
    </div>
  );
}

function toEntryRow(entry: {
  id: string;
  title: string | null;
  body: string | null;
  translations: unknown;
  entryDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}): EntryRow {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    translations: entry.translations,
    entryDate: entry.entryDate,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function JournalWriteBody({
  greetingName,
  subtitle,
  sourceLanguage,
  targetLanguage,
  translateTrigger,
  entryId: initialEntryId,
  initialTitle,
  initialBody,
  initialTranslations,
  pastEntries,
  dailyPrompt: initialDailyPrompt,
}: JournalWriteBodyProps) {
  const [source, setSource] = useState(sourceLanguage);
  const [target, setTarget] = useState(targetLanguage);
  const [activeEntryId, setActiveEntryId] = useState(initialEntryId);
  const [entryTitle, setEntryTitle] = useState(initialTitle?.trim() ?? "");
  const [draftBody, setDraftBody] = useState(initialBody);
  const [editorInitialBody, setEditorInitialBody] = useState(initialBody);
  const [editorInitialTranslations, setEditorInitialTranslations] =
    useState(initialTranslations);
  const [editorSeed, setEditorSeed] = useState(0);
  const [savedEntries, setSavedEntries] = useState(pastEntries);
  const [dailyPrompt, setDailyPrompt] = useState(initialDailyPrompt ?? null);
  const [finishPending, setFinishPending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [activePromptText, setActivePromptText] = useState(
    initialDailyPrompt?.text ?? "",
  );
  const [usePromptPending, setUsePromptPending] = useState(false);
  const entryColumnRef = useRef<HTMLDivElement>(null);
  const pastEntriesSectionRef = useRef<HTMLElement>(null);
  const editorRef = useRef<JournalEditorHandle>(null);

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = window.setTimeout(() => setSuccessMessage(null), 8000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const handlePromptChange = useCallback((promptText: string) => {
    setActivePromptText(promptText);
  }, []);

  const handleUsePrompt = useCallback(
    async (promptText: string) => {
      const title = promptText.trim();
      if (!title || usePromptPending) {
        return;
      }

      setUsePromptPending(true);
      try {
        const res = await fetch(`/api/entries/${activeEntryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (res.ok) {
          setEntryTitle(title);
        }
      } finally {
        setUsePromptPending(false);
      }
    },
    [activeEntryId, usePromptPending],
  );

  const handleFinish = useCallback(async () => {
    if (finishPending) {
      return;
    }

    setFinishPending(true);
    setFinishError(null);
    setSuccessMessage(null);

    try {
      const draft = editorRef.current?.getDraftContent();

      const res = await fetch(`/api/entries/${activeEntryId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: entryTitle,
          body: draft?.body ?? draftBody,
          translations: draft?.translations,
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setFinishError(
          payload?.error ?? "Couldn't save your entry. Try again.",
        );
        return;
      }

      const data = (await res.json()) as {
        completedEntry: EntryRow;
        newEntry: { id: string };
        dailyPrompt: DailyPromptState | null;
      };

      setSavedEntries((current) => [
        toEntryRow(data.completedEntry),
        ...current,
      ]);
      setActiveEntryId(data.newEntry.id);
      setEntryTitle("");
      setDraftBody("");
      setEditorInitialBody("");
      setEditorInitialTranslations([]);
      setEditorSeed((value) => value + 1);
      setDailyPrompt(data.dailyPrompt);
      setActivePromptText(data.dailyPrompt?.text ?? "");
      setSuccessMessage(FINISH_SUCCESS_MESSAGE);

      pastEntriesSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } finally {
      setFinishPending(false);
    }
  }, [activeEntryId, draftBody, entryTitle, finishPending]);

  const isPromptAdopted =
    activePromptText.trim().length > 0 &&
    entryTitle.trim() === activePromptText.trim();

  const canFinish = Boolean(entryTitle.trim() || draftBody.trim());

  const handleLanguagesSaved = useCallback(
    (nextSource: string, nextTarget: string) => {
      setSource(nextSource);
      setTarget(nextTarget);
    },
    [],
  );

  const entryEditorColumn = (
    <div ref={entryColumnRef} className="flex min-w-0 flex-col gap-3">
      <EntryTitleField
        key={activeEntryId}
        entryId={activeEntryId}
        initialTitle={entryTitle}
        inputId={`entry-title-${activeEntryId}`}
        className={journalWriteTitleClassName}
        onTitleChange={setEntryTitle}
      />

      <JournalEditor
        key={`${activeEntryId}-${editorSeed}`}
        ref={editorRef}
        entryId={activeEntryId}
        initialBody={editorInitialBody}
        initialTranslations={editorInitialTranslations}
        sourceLanguage={source}
        targetLanguage={target}
        translateTrigger={translateTrigger}
        onBodyChange={setDraftBody}
      />
    </div>
  );

  return (
    <div className={appPageShellClassName}>
      <JournalHomeHeader
        greetingName={greetingName}
        subtitle={subtitle}
        source={source}
        target={target}
        translateTrigger={translateTrigger}
        onLanguagesSaved={handleLanguagesSaved}
      />

      {dailyPrompt ? (
        <div className={journalWriteWorkspaceClassName}>
          <DailyPromptCard
            key={activeEntryId}
            entryId={activeEntryId}
            initialPrompt={dailyPrompt}
            isToday
            isPromptAdopted={isPromptAdopted}
            onUsePrompt={(promptText) => void handleUsePrompt(promptText)}
            usePromptPending={usePromptPending}
            onPromptChange={handlePromptChange}
          />
          {entryEditorColumn}
        </div>
      ) : (
        entryEditorColumn
      )}

      <SaveEntryBar
        anchorRef={entryColumnRef}
        canFinish={canFinish}
        finishPending={finishPending}
        successMessage={successMessage}
        finishError={finishError}
        onFinish={handleFinish}
      />

      <PastEntriesScrollHint
        visible={savedEntries.length > 0}
        pastEntriesSectionRef={pastEntriesSectionRef}
      />

      {savedEntries.length > 0 ? (
        <PastEntriesSection
          entries={savedEntries}
          sectionRef={pastEntriesSectionRef}
        />
      ) : null}
    </div>
  );
}

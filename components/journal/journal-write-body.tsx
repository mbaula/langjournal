"use client";

import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { journalWriteAreaShellClassName, journalWriteEditorContainerClassName, journalWriteEditorMinHeightClassName, journalWritePageShellClassName, journalWriteTitleClassName, journalWriteViewportClassName, journalWriteWorkspaceClassName } from "@/components/journal/field-styles";
import { DailyPromptCard } from "@/components/journal/daily-prompt-card";
import { EntryTitleField } from "@/components/journal/entry-title-field";
import { type EntryRow } from "@/components/journal/entry-list";
import {
  PastEntriesSection,
  type PastEntriesFocusRequest,
} from "@/components/journal/past-entries-section";
import { JournalHomeHeader } from "@/components/journal/journal-home-header";
import { LanguageBar } from "@/components/journal/language-bar";
import { SaveEntryBar } from "@/components/journal/save-entry-bar";
import { ListenButton } from "@/components/speech/listen-button";
import {
  JournalEditor,
  type InlineTranslation,
  type JournalEditorHandle,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";
import type { UserLanguageEntry } from "@/lib/db/onboarding";
import { buildPastEntryLanguageTabs } from "@/lib/languages/past-entries-language-tabs";
import type { DailyPromptState } from "@/lib/prompts/prompt-core";
import { countWords } from "@/lib/text/word-count";
import { cn } from "@/lib/utils";

type JournalWriteBodyProps = {
  greeting: string;
  subtitle: string;
  sourceLanguage: string;
  targetLanguage: string;
  learningLanguages?: readonly UserLanguageEntry[];
  translateTrigger?: TranslateTrigger;
  entryId: string;
  initialTitle: string | null;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  pastEntries: EntryRow[];
  dailyPrompt?: DailyPromptState | null;
  initialEditEntryId?: string | null;
};

export type { JournalWriteBodyProps };

function PastEntriesScrollHint({
  visible,
  pastEntriesSectionRef,
}: {
  visible: boolean;
  pastEntriesSectionRef: React.RefObject<HTMLElement | null>;
}) {
  const t = useTranslations("journal");
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
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
        <ArrowDown className="size-3.5 shrink-0 sm:size-4" />
        <span className="leading-snug">{t("scrollPastEntries")}</span>
      </p>
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
  flashcardCount?: number;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
}): EntryRow {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    translations: entry.translations,
    entryDate: entry.entryDate,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    flashcardCount: entry.flashcardCount ?? 0,
    sourceLanguage: entry.sourceLanguage ?? null,
    targetLanguage: entry.targetLanguage ?? null,
  };
}

export function JournalWriteBody({
  greeting,
  subtitle,
  sourceLanguage,
  targetLanguage,
  learningLanguages = [],
  translateTrigger,
  entryId: initialEntryId,
  initialTitle,
  initialBody,
  initialTranslations,
  pastEntries,
  dailyPrompt: initialDailyPrompt,
  initialEditEntryId,
}: JournalWriteBodyProps) {
  const t = useTranslations("journal");
  const locale = useLocale();
  const router = useRouter();
  const [source, setSource] = useState(sourceLanguage);
  const [target, setTarget] = useState(targetLanguage);
  const [activeEntryId, setActiveEntryId] = useState(initialEntryId);
  const [entryTitle, setEntryTitle] = useState(initialTitle ?? "");
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
  const [pastEntriesFocusRequest, setPastEntriesFocusRequest] =
    useState<PastEntriesFocusRequest | null>(null);
  const pastEntriesSectionRef = useRef<HTMLElement>(null);
  const editorRef = useRef<JournalEditorHandle>(null);

  const hasPastEntriesSection = useMemo(
    () =>
      savedEntries.length > 0 &&
      buildPastEntryLanguageTabs(savedEntries, learningLanguages, locale)
        .length > 0,
    [learningLanguages, locale, savedEntries],
  );

  useEffect(() => {
    if (!successMessage) {
      return;
    }
    const timer = window.setTimeout(() => setSuccessMessage(null), 8000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (!initialEditEntryId) {
      return;
    }

    router.replace("/app/journal", { scroll: false });
  }, [initialEditEntryId, router]);

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
      await editorRef.current?.flushSave({ persist: false });
      const draft = editorRef.current?.getDraftContent();

      const res = await fetch(`/api/entries/${activeEntryId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: entryTitle,
          body: draft?.body ?? draftBody,
          translations: draft?.translations,
          sourceLanguage: source,
          targetLanguage: target,
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
      setSuccessMessage(t("entrySaved"));
      setPastEntriesFocusRequest({
        languageCode: target,
        entryId: data.completedEntry.id,
      });
    } finally {
      setFinishPending(false);
    }
  }, [activeEntryId, draftBody, entryTitle, finishPending, source, target, t]);

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

  const handlePastEntryUpdated = useCallback((entry: EntryRow) => {
    setSavedEntries((current) =>
      current.map((item) => (item.id === entry.id ? entry : item)),
    );
  }, []);

  const handlePastEntryDeleted = useCallback((entryId: string) => {
    setSavedEntries((current) => current.filter((item) => item.id !== entryId));
  }, []);

  const entryEditorColumn = (
    <div className={journalWriteAreaShellClassName}>
      <div className="flex items-start justify-between gap-3">
        <LanguageBar
          source={source}
          target={target}
          learningLanguages={learningLanguages}
          translateTrigger={translateTrigger}
          onLanguagesSaved={handleLanguagesSaved}
        />
        <ListenButton
          text={draftBody}
          languageCode={target}
          label="Listen to entry"
        />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden">
        <EntryTitleField
          key={activeEntryId}
          entryId={activeEntryId}
          initialTitle={entryTitle}
          inputId={`entry-title-${activeEntryId}`}
          className={cn(journalWriteTitleClassName, "mb-4 sm:mb-5")}
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
          bodyMinHeightClassName={journalWriteEditorMinHeightClassName}
          containerMinHeightClassName={journalWriteEditorContainerClassName}
        />

        <SaveEntryBar
          canFinish={canFinish}
          finishPending={finishPending}
          successMessage={successMessage}
          finishError={finishError}
          onFinish={handleFinish}
          wordCount={countWords(draftBody)}
        />
      </div>
    </div>
  );

  return (
    <div className={journalWritePageShellClassName}>
      <JournalHomeHeader greeting={greeting} subtitle={subtitle} />

      {dailyPrompt ? (
        <div
          className={cn(
            journalWriteWorkspaceClassName,
            journalWriteViewportClassName,
          )}
        >
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
        <div className={journalWriteViewportClassName}>{entryEditorColumn}</div>
      )}

      <PastEntriesScrollHint
        visible={hasPastEntriesSection}
        pastEntriesSectionRef={pastEntriesSectionRef}
      />

      {hasPastEntriesSection ? (
        <PastEntriesSection
          entries={savedEntries}
          targetLanguage={target}
          sourceLanguage={source}
          learningLanguages={learningLanguages}
          translateTrigger={translateTrigger}
          onLanguagesSaved={handleLanguagesSaved}
          onEntryUpdated={handlePastEntryUpdated}
          onEntryDeleted={handlePastEntryDeleted}
          initialEditingEntryId={initialEditEntryId}
          sectionRef={pastEntriesSectionRef}
          focusRequest={pastEntriesFocusRequest}
          onFocusRequestHandled={() => setPastEntriesFocusRequest(null)}
        />
      ) : null}
    </div>
  );
}

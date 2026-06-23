"use client";

import { ArrowDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { appPageShellClassName } from "@/components/journal/field-styles";
import { EntryList, type EntryRow } from "@/components/journal/entry-list";
import { JournalHomeHeader } from "@/components/journal/journal-home-header";
import {
  JournalEditor,
  type InlineTranslation,
  type TranslateTrigger,
} from "@/components/journal/journal-editor";

type JournalWriteBodyProps = {
  greetingName: string;
  subtitle: string;
  sourceLanguage: string;
  targetLanguage: string;
  translateTrigger?: TranslateTrigger;
  entryId: string;
  initialBody: string;
  initialTranslations: InlineTranslation[];
  pastEntries: EntryRow[];
  prompt?: ReactNode;
};

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

export function JournalWriteBody({
  greetingName,
  subtitle,
  sourceLanguage,
  targetLanguage,
  translateTrigger,
  entryId,
  initialBody,
  initialTranslations,
  pastEntries,
  prompt,
}: JournalWriteBodyProps) {
  const [source, setSource] = useState(sourceLanguage);
  const [target, setTarget] = useState(targetLanguage);
  const pastEntriesSectionRef = useRef<HTMLElement>(null);

  const handleLanguagesSaved = useCallback(
    (nextSource: string, nextTarget: string) => {
      setSource(nextSource);
      setTarget(nextTarget);
    },
    [],
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

      {prompt}

      <JournalEditor
        key={entryId}
        entryId={entryId}
        initialBody={initialBody}
        initialTranslations={initialTranslations}
        sourceLanguage={source}
        targetLanguage={target}
        translateTrigger={translateTrigger}
      />

      <PastEntriesScrollHint
        visible={pastEntries.length > 0}
        pastEntriesSectionRef={pastEntriesSectionRef}
      />

      {pastEntries.length > 0 ? (
        <section
          ref={pastEntriesSectionRef}
          className="space-y-4 border-t border-border/80 pt-8"
        >
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Past entries
          </h2>
          <EntryList entries={pastEntries} />
        </section>
      ) : null}
    </div>
  );
}

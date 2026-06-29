"use client";

import {
  Layers,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CardLanguageViewSelector,
  type CardLanguageView,
} from "@/components/flashcards/card-language-view-selector";
import { FlashcardLibraryCard } from "@/components/flashcards/flashcard-library-card";
import { FlashcardLibraryEntrySections } from "@/components/flashcards/flashcard-library-entry-sections";
import {
  FlashcardLibraryGrid,
} from "@/components/flashcards/flashcard-library-grid";
import { FlashcardPracticeStage } from "@/components/flashcards/flashcard-practice-stage";
import { FlashcardSortSelector } from "@/components/flashcards/flashcard-sort-selector";
import {
  flashcardToolbarFiltersGroupClassName,
  flashcardToolbarRowClassName,
  flashcardToolbarSearchClassName,
  flashcardToolbarSearchWrapClassName,
} from "@/components/flashcards/flashcard-toolbar-styles";
import { Button } from "@/components/ui/button";
import {
  journalPageTitleClassName,
  practicePillButtonClassName,
} from "@/components/journal/field-styles";
import {
  type FlashcardPracticeStats,
  type FlashcardRecord,
} from "@/lib/flashcards/types";
import {
  groupFlashcardsByEntry,
  sortFlashcardsForLibrary,
  type FlashcardLibrarySort,
} from "@/lib/flashcards/library-sort";

type ViewMode = "library" | "practice";

type FlashcardsViewProps = {
  initialFlashcards: FlashcardRecord[];
  initialStats: FlashcardPracticeStats;
  initialItemCount: number;
  nativeLanguage?: string;
  targetLanguage?: string;
  previewMode?: boolean;
};

const AUTOSAVE_MS = 700;

function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

export function FlashcardsView({
  initialFlashcards,
  initialStats,
  initialItemCount,
  nativeLanguage,
  targetLanguage,
  previewMode = false,
}: FlashcardsViewProps) {
  const [flashcards, setFlashcards] = useState(initialFlashcards);
  const [stats, setStats] = useState(initialStats);
  const [viewMode, setViewMode] = useState<ViewMode>("library");
  const [search, setSearch] = useState("");
  const [librarySort, setLibrarySort] = useState<FlashcardLibrarySort>("entry");
  const [cardLanguageView, setCardLanguageView] =
    useState<CardLanguageView>("translation");
  const [hasMounted, setHasMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [practiceQueue, setPracticeQueue] = useState<FlashcardRecord[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceFlipped, setPracticeFlipped] = useState(false);
  const [practiceSlideDirection, setPracticeSlideDirection] = useState<1 | -1>(1);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const practiceIndexRef = useRef(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (initialFlashcards.length > 0) {
      setFlashcards(initialFlashcards);
    }
  }, [initialFlashcards]);

  useEffect(() => {
    practiceIndexRef.current = practiceIndex;
  }, [practiceIndex]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flashcards.filter((card) => {
      if (!q) return true;
      return (
        card.word.toLowerCase().includes(q) ||
        card.translation.toLowerCase().includes(q)
      );
    });
  }, [flashcards, search]);

  const entryGroups = useMemo(
    () => groupFlashcardsByEntry(filteredCards),
    [filteredCards],
  );

  const recentSortedCards = useMemo(
    () => sortFlashcardsForLibrary(filteredCards, "recent"),
    [filteredCards],
  );

  const libraryOrderedCards = useMemo(() => {
    if (librarySort === "entry") {
      return entryGroups.flatMap((group) => group.cards);
    }
    return recentSortedCards;
  }, [entryGroups, librarySort, recentSortedCards]);

  const displayedItemCount = hasMounted
    ? filteredCards.length
    : initialItemCount;

  const patchFlashcard = useCallback(
    async (id: string, patch: Partial<FlashcardRecord>) => {
      if (previewMode) {
        setFlashcards((prev) =>
          prev.map((card) =>
            card.id === id ? { ...card, ...patch, updatedAt: new Date().toISOString() } : card,
          ),
        );
        return;
      }

      const res = await fetch(`/api/flashcards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: patch.word,
          translation: patch.translation,
        }),
      });
      const data = (await res.json()) as { flashcard?: FlashcardRecord };
      if (data.flashcard) {
        setFlashcards((prev) =>
          prev.map((card) => (card.id === id ? data.flashcard! : card)),
        );
      }
    },
    [previewMode],
  );

  const scheduleAutosave = useCallback(
    (
      id: string,
      patch: Partial<FlashcardRecord>,
      localUpdater: (cards: FlashcardRecord[]) => FlashcardRecord[],
    ) => {
      setFlashcards(localUpdater);
      const existing = saveTimersRef.current.get(id);
      if (existing) clearTimeout(existing);
      saveTimersRef.current.set(
        id,
        setTimeout(() => {
          void patchFlashcard(id, patch);
          saveTimersRef.current.delete(id);
        }, AUTOSAVE_MS),
      );
    },
    [patchFlashcard],
  );

  const deleteFlashcard = useCallback(
    async (id: string) => {
      if (previewMode) {
        setFlashcards((prev) => prev.filter((card) => card.id !== id));
        setExpandedId(null);
        setDeleteConfirmId(null);
        return;
      }

      const res = await fetch(`/api/flashcards/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 404) {
        setFlashcards((prev) => prev.filter((card) => card.id !== id));
        setExpandedId(null);
        setDeleteConfirmId(null);
      }
    },
    [previewMode],
  );

  const startPractice = useCallback(() => {
    const queue = libraryOrderedCards;
    if (queue.length === 0) {
      setViewMode("practice");
      setPracticeQueue([]);
      return;
    }
    setPracticeQueue(queue);
    setPracticeIndex(0);
    practiceIndexRef.current = 0;
    setPracticeFlipped(false);
    setPracticeSlideDirection(1);
    setViewMode("practice");
    setExpandedId(null);
  }, [libraryOrderedCards]);

  const goToPreviousPracticeCard = useCallback(() => {
    if (practiceIndexRef.current <= 0) return;
    setPracticeSlideDirection(-1);
    setPracticeIndex((index) => index - 1);
    setPracticeFlipped(false);
  }, []);

  const goToNextPracticeCard = useCallback(() => {
    if (practiceIndexRef.current >= practiceQueue.length - 1) return;
    setPracticeSlideDirection(1);
    setPracticeIndex((index) => index + 1);
    setPracticeFlipped(false);
  }, [practiceQueue.length]);

  const togglePracticeFlip = useCallback(() => {
    if (cardLanguageView === "both") return;
    setPracticeFlipped((flipped) => !flipped);
  }, [cardLanguageView]);

  useEffect(() => {
    if (viewMode !== "practice" || practiceQueue.length === 0) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      if (event.key === " " && target instanceof HTMLButtonElement) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goToPreviousPracticeCard();
          break;
        case "ArrowRight":
          event.preventDefault();
          goToNextPracticeCard();
          break;
        case "ArrowUp":
        case "ArrowDown":
        case " ":
          event.preventDefault();
          togglePracticeFlip();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    viewMode,
    practiceQueue.length,
    goToPreviousPracticeCard,
    goToNextPracticeCard,
    togglePracticeFlip,
  ]);

  const renderLibraryCard = (card: FlashcardRecord) => {
    const expanded = expandedId === card.id;
    const showTranslationOnly = cardLanguageView === "translation";

    return (
      <FlashcardLibraryCard
        card={card}
        cardLanguageView={cardLanguageView}
        expanded={expanded}
        deleteConfirming={deleteConfirmId === card.id}
        previewMode={previewMode}
        onToggleExpand={() =>
          setExpandedId((current) => (current === card.id ? null : card.id))
        }
        onPrimaryChange={(value) => {
          const patch = showTranslationOnly
            ? { word: value }
            : { translation: value };
          scheduleAutosave(
            card.id,
            patch,
            (prev) =>
              prev.map((item) =>
                item.id === card.id ? { ...item, ...patch } : item,
              ),
          );
        }}
        onSecondaryChange={(value) => {
          const patch = showTranslationOnly
            ? { translation: value }
            : { word: value };
          scheduleAutosave(
            card.id,
            patch,
            (prev) =>
              prev.map((item) =>
                item.id === card.id ? { ...item, ...patch } : item,
              ),
          );
        }}
        onDeleteRequest={() => setDeleteConfirmId(card.id)}
        onDeleteCancel={() => setDeleteConfirmId(null)}
        onDeleteConfirm={() => void deleteFlashcard(card.id)}
        onAudioChange={(hasAudio) => {
          setFlashcards((prev) =>
            prev.map((item) =>
              item.id === card.id ? { ...item, hasAudio } : item,
            ),
          );
        }}
      />
    );
  };

  if (viewMode === "practice") {
    const current = practiceQueue[practiceIndex];

    if (!current) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-md text-base text-muted-foreground">
            You&apos;re all caught up. Come back after your next journal entry.
          </p>
          <Button type="button" variant="outline" onClick={() => setViewMode("library")}>
            Back to library
          </Button>
        </div>
      );
    }

    return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => setViewMode("library")}>
            <X className="size-4" />
            Exit
          </Button>
          <div className="flex items-center gap-3">
            {nativeLanguage && targetLanguage ? (
              <CardLanguageViewSelector
                value={cardLanguageView}
                onChange={setCardLanguageView}
              />
            ) : null}
            <p className="text-sm text-muted-foreground">
              {practiceIndex + 1} / {practiceQueue.length}
            </p>
          </div>
        </div>

        <FlashcardPracticeStage
          card={current}
          cardLanguageView={cardLanguageView}
          flipped={practiceFlipped}
          slideDirection={practiceSlideDirection}
          onFlip={togglePracticeFlip}
        />

        <p className="text-center text-xs text-muted-foreground">
          ← → previous / next card · ↑ ↓ Space reveal answer
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={journalPageTitleClassName}>Practice</h1>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {itemCountLabel(displayedItemCount)}
            </span>
          </div>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            Review words saved from your journal and keep what you&apos;re learning
            fresh.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={startPractice}
            disabled={filteredCards.length === 0}
            className={practicePillButtonClassName}
          >
            {hasMounted ? (
              <Layers className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            ) : (
              <span className="inline-block size-4 shrink-0" aria-hidden />
            )}
            Practice
          </Button>
        </div>
      </header>

      {flashcards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mx-auto max-w-md text-base leading-relaxed text-muted-foreground">
            No words saved yet. Start journaling and use // to translate. Words you
            look up will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className={flashcardToolbarRowClassName}>
            <div className={flashcardToolbarFiltersGroupClassName}>
              <FlashcardSortSelector
                value={librarySort}
                onChange={setLibrarySort}
              />
              {nativeLanguage && targetLanguage ? (
                <CardLanguageViewSelector
                  variant="toolbar"
                  value={cardLanguageView}
                  onChange={setCardLanguageView}
                />
              ) : null}
            </div>
            <div className={flashcardToolbarSearchWrapClassName}>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                id="flashcards-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search items…"
                className={flashcardToolbarSearchClassName}
              />
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No items match your filters.
            </p>
          ) : librarySort === "entry" ? (
            <FlashcardLibraryEntrySections
              groups={entryGroups}
              getItemKey={(card) => card.id}
              renderItem={renderLibraryCard}
            />
          ) : (
            <FlashcardLibraryGrid
              items={recentSortedCards}
              getItemKey={(card) => card.id}
              renderItem={renderLibraryCard}
            />
          )}
        </>
      )}
    </div>
  );
}

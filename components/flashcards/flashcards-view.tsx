"use client";

import {
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CardLanguageViewSelector,
  type CardLanguageView,
} from "@/components/flashcards/card-language-view-selector";
import { FlashcardLibraryCard } from "@/components/flashcards/flashcard-library-card";
import { FlashcardLibraryGrid } from "@/components/flashcards/flashcard-library-grid";
import { Button } from "@/components/ui/button";
import {
  journalPageTitleClassName,
  primaryPillButtonClassName,
} from "@/components/journal/field-styles";
import {
  type FlashcardPracticeStats,
  type FlashcardRecord,
  type PracticeResponse,
} from "@/lib/flashcards/types";
import { proficiencyAfterPracticeResponse } from "@/lib/flashcards/proficiency";
import { sortFlashcardsForPractice } from "@/lib/flashcards/practice";
import { cn } from "@/lib/utils";

type ViewMode = "library" | "practice" | "summary";

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
  const [cardLanguageView, setCardLanguageView] =
    useState<CardLanguageView>("translation");
  const [hasMounted, setHasMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [practiceQueue, setPracticeQueue] = useState<FlashcardRecord[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceFlipped, setPracticeFlipped] = useState(false);
  const [sessionReviews, setSessionReviews] = useState<
    Array<{ flashcardId: string; response: PracticeResponse }>
  >([]);
  const [sessionMastered, setSessionMastered] = useState(0);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (previewMode) return;

    void fetch("/api/flashcards?sync=1")
      .then((res) => res.json())
      .then(
        (data: {
          flashcards?: FlashcardRecord[];
          stats?: FlashcardPracticeStats;
        }) => {
          if (Array.isArray(data.flashcards)) setFlashcards(data.flashcards);
          if (data.stats) setStats(data.stats);
        },
      )
      .catch(() => {
        // keep initial server data
      });
  }, [previewMode]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flashcards.filter((card) => {
      if (targetLanguage && card.languageCode !== targetLanguage) {
        return false;
      }
      if (!q) return true;
      return (
        card.word.toLowerCase().includes(q) ||
        card.translation.toLowerCase().includes(q)
      );
    });
  }, [flashcards, search, targetLanguage]);

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
    const queue = sortFlashcardsForPractice(
      flashcards.filter((card) => card.proficiency !== "MASTERED"),
    );
    if (queue.length === 0) {
      setViewMode("practice");
      setPracticeQueue([]);
      return;
    }
    setPracticeQueue(queue);
    setPracticeIndex(0);
    setPracticeFlipped(false);
    setSessionReviews([]);
    setSessionMastered(0);
    setViewMode("practice");
    setExpandedId(null);
  }, [flashcards]);

  const submitPracticeResponse = useCallback(
    async (response: PracticeResponse) => {
      const card = practiceQueue[practiceIndex];
      if (!card) return;

      const review = { flashcardId: card.id, response };
      const nextReviews = [...sessionReviews, review];
      setSessionReviews(nextReviews);

      if (response === "got_it" && card.proficiency !== "MASTERED") {
        setSessionMastered((count) => count + 1);
      }

      if (practiceIndex >= practiceQueue.length - 1) {
        if (previewMode) {
          setFlashcards((prev) =>
            prev.map((item) => {
              const review = nextReviews.find((entry) => entry.flashcardId === item.id);
              if (!review) return item;
              return {
                ...item,
                proficiency: proficiencyAfterPracticeResponse(
                  item.proficiency,
                  review.response,
                ),
              };
            }),
          );
          setStats((prev) => ({
            currentStreak: prev.currentStreak + 1,
            lastPracticeDate: new Date().toISOString().slice(0, 10),
          }));
          setViewMode("summary");
          return;
        }

        const res = await fetch("/api/flashcards/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviews: nextReviews }),
        });
        const data = (await res.json()) as {
          stats?: FlashcardPracticeStats;
          flashcards?: FlashcardRecord[];
          masteredCount?: number;
        };

        if (data.stats) setStats(data.stats);
        if (Array.isArray(data.flashcards)) {
          setFlashcards((prev) => {
            const byId = new Map(data.flashcards!.map((c) => [c.id, c]));
            return prev.map((item) => byId.get(item.id) ?? item);
          });
        }
        setSessionMastered(data.masteredCount ?? sessionMastered);
        setViewMode("summary");
        return;
      }

      setPracticeIndex((index) => index + 1);
      setPracticeFlipped(false);
    },
    [practiceIndex, practiceQueue, previewMode, sessionMastered, sessionReviews],
  );

  if (viewMode === "practice") {
    const current = practiceQueue[practiceIndex];

    if (!current) {
      return (
        <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 text-center">
          <p className="max-w-md text-[15px] text-muted-foreground">
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
            <p className="text-[13px] text-muted-foreground">
              {practiceIndex + 1} / {practiceQueue.length}
            </p>
          </div>
        </div>

        {cardLanguageView === "both" ? (
          <div className="min-h-[280px] rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
                {current.word}
              </p>
              <p className="text-xl font-medium text-muted-foreground">
                {current.translation}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="min-h-[280px] rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-transform active:scale-[0.99]"
            onClick={() => setPracticeFlipped((flipped) => !flipped)}
          >
            {!practiceFlipped ? (
              <div className="flex h-full flex-col justify-center gap-4">
                <p className="text-center text-3xl font-semibold tracking-[-0.02em] text-foreground">
                  {cardLanguageView === "native"
                    ? current.translation
                    : current.word}
                </p>
                <p className="text-center text-[13px] text-muted-foreground">
                  Tap to reveal
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center gap-4">
                <p className="text-center text-xl font-medium text-foreground">
                  {cardLanguageView === "native"
                    ? current.word
                    : current.translation}
                </p>
              </div>
            )}
          </button>
        )}

        {practiceFlipped || cardLanguageView === "both" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 whitespace-normal py-2"
              onClick={() => void submitPracticeResponse("still_learning")}
            >
              Still learning
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 whitespace-normal py-2"
              onClick={() => void submitPracticeResponse("almost")}
            >
              Almost got it
            </Button>
            <Button
              type="button"
              className="h-auto min-h-11 whitespace-normal py-2"
              onClick={() => void submitPracticeResponse("got_it")}
            >
              Got it
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  if (viewMode === "summary") {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Session complete</h2>
          <p className="text-[13px] text-muted-foreground">
            Nice work — your progress is saved.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-4">
            <p className="text-2xl font-semibold">{sessionReviews.length}</p>
            <p className="text-[12px] text-muted-foreground">Items reviewed</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-2xl font-semibold">{sessionMastered}</p>
            <p className="text-[12px] text-muted-foreground">Marked mastered</p>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-2xl font-semibold">{stats.currentStreak}</p>
            <p className="text-[12px] text-muted-foreground">Day streak</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={startPractice}
            className={primaryPillButtonClassName}
          >
            <RotateCcw className="size-4 shrink-0" strokeWidth={1.75} />
            Practice again
          </Button>
          <Button type="button" variant="outline" onClick={() => setViewMode("library")}>
            Back to library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={journalPageTitleClassName}>Practice</h1>
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              {itemCountLabel(displayedItemCount)}
            </span>
          </div>
          <p className="max-w-lg text-[13px] leading-relaxed text-muted-foreground">
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
            disabled={flashcards.length === 0}
            className={primaryPillButtonClassName}
          >
            Practice
          </Button>
          {nativeLanguage && targetLanguage ? (
            <CardLanguageViewSelector
              value={cardLanguageView}
              onChange={setCardLanguageView}
            />
          ) : null}
        </div>
      </header>

      {flashcards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted-foreground">
            No words saved yet. Start journaling and use // to translate. Words you
            look up will show up here.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <div className="relative min-w-0 max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="flashcards-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search items…"
                className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent py-1 pr-2.5 pl-9 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No items match your filters.
            </p>
          ) : (
            <FlashcardLibraryGrid
              items={filteredCards}
              getItemKey={(card) => card.id}
              renderItem={(card) => {
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
                      setExpandedId((current) =>
                        current === card.id ? null : card.id,
                      )
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
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

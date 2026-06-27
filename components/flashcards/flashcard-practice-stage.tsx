"use client";

import type { CardLanguageView } from "@/components/flashcards/card-language-view-selector";
import type { FlashcardRecord } from "@/lib/flashcards/types";
import { cn } from "@/lib/utils";

type FlashcardPracticeStageProps = {
  card: FlashcardRecord;
  cardLanguageView: CardLanguageView;
  flipped: boolean;
  slideDirection: 1 | -1;
  onFlip: () => void;
};

export function FlashcardPracticeStage({
  card,
  cardLanguageView,
  flipped,
  slideDirection,
  onFlip,
}: FlashcardPracticeStageProps) {
  const slideClassName =
    slideDirection === 1 ? "flashcard-slide-in-next" : "flashcard-slide-in-prev";

  if (cardLanguageView === "both") {
    return (
      <div
        key={card.id}
        className={cn(
          "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-sm",
          slideClassName,
        )}
      >
        <p className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {card.word}
        </p>
        <p className="text-xl font-medium text-muted-foreground">
          {card.translation}
        </p>
      </div>
    );
  }

  return (
    <button
      key={card.id}
      type="button"
      className={cn(
        "min-h-[280px] w-full rounded-2xl border border-border bg-card p-8 text-left shadow-sm transition-transform active:scale-[0.99]",
        slideClassName,
      )}
      onClick={onFlip}
    >
      {!flipped ? (
        <div className="flex h-full flex-col justify-center gap-4">
          <p className="text-center text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {cardLanguageView === "native" ? card.translation : card.word}
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Tap or press ↑ ↓ Space to reveal
          </p>
        </div>
      ) : (
        <div className="flashcard-reveal-fade flex h-full flex-col justify-center gap-4">
          <p className="text-center text-xl font-medium text-foreground">
            {cardLanguageView === "native" ? card.word : card.translation}
          </p>
        </div>
      )}
    </button>
  );
}

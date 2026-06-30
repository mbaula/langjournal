"use client";

import type { CardLanguageView } from "@/components/flashcards/card-language-view-selector";
import { InlineListenButton } from "@/components/speech/inline-listen-button";
import type { FlashcardRecord } from "@/lib/flashcards/types";
import { cn } from "@/lib/utils";

type FlashcardPracticeStageProps = {
  card: FlashcardRecord;
  cardLanguageView: CardLanguageView;
  flipped: boolean;
  slideDirection: 1 | -1;
  nativeLanguage?: string;
  onFlip: () => void;
};

export function FlashcardPracticeStage({
  card,
  cardLanguageView,
  flipped,
  slideDirection,
  nativeLanguage,
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
        <div className="flex items-center gap-2">
          <p className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
            {card.word}
          </p>
          <InlineListenButton
            text={card.word}
            languageCode={card.languageCode}
          />
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xl font-medium text-muted-foreground">
            {card.translation}
          </p>
          {nativeLanguage ? (
            <InlineListenButton
              text={card.translation}
              languageCode={nativeLanguage}
              size="sm"
            />
          ) : null}
        </div>
      </div>
    );
  }

  const frontText =
    cardLanguageView === "native" ? card.translation : card.word;
  const backText =
    cardLanguageView === "native" ? card.word : card.translation;
  const frontLanguage =
    cardLanguageView === "native" ? nativeLanguage : card.languageCode;
  const backLanguage =
    cardLanguageView === "native" ? card.languageCode : nativeLanguage;

  return (
    <div
      key={card.id}
      className={cn(
        "min-h-[280px] w-full rounded-2xl border border-border bg-card p-8 shadow-sm",
        slideClassName,
      )}
    >
      {!flipped ? (
        <button
          type="button"
          className="flex h-full w-full flex-col items-center justify-center gap-4 transition-transform active:scale-[0.99]"
          onClick={onFlip}
        >
          <div className="flex items-center gap-2">
            <p className="text-center text-3xl font-semibold tracking-[-0.02em] text-foreground">
              {frontText}
            </p>
            {frontLanguage ? (
              <InlineListenButton
                text={frontText}
                languageCode={frontLanguage}
                onClick={(e) => e.stopPropagation()}
              />
            ) : null}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Tap or press ↑ ↓ Space to reveal
          </p>
        </button>
      ) : (
        <div className="flashcard-reveal-fade flex h-full flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-center text-xl font-medium text-foreground">
              {backText}
            </p>
            {backLanguage ? (
              <InlineListenButton
                text={backText}
                languageCode={backLanguage}
                size="sm"
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

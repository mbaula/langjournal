"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";

import {
  marketingFlowDescriptionClassName,
  marketingFlowEyebrowClassName,
  marketingFlowFieldClassName,
  marketingFlowNavButtonClassName,
  marketingFlowTitleClassName,
} from "@/components/marketing/marketing-flow-styles";
import {
  ONBOARDING_QUESTION_COUNT,
} from "@/components/onboarding/onboarding-progress";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  OnboardingStepTransition,
  type OnboardingStepDirection,
} from "@/components/onboarding/onboarding-step-transition";
import { Button } from "@/components/ui/button";
import type { OnboardingState, UserLanguageEntry } from "@/lib/db/onboarding";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import { resolveLanguageLabel } from "@/lib/languages/display-name";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/labels";
import { cn } from "@/lib/utils";

type Lang = { code: string; name: string };

const LEVEL_COPY: Record<
  OnboardingLanguageLevel,
  { title: string; description: string }
> = {
  beginner: {
    title: "Beginner",
    description: "I just started learning",
  },
  intermediate: {
    title: "Intermediate",
    description: "I can communicate on familiar topics",
  },
  proficient: {
    title: "Proficient",
    description: "I can express myself in many situations",
  },
};

const selectChevronClass =
  "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";

type OnboardingFlowProps = {
  initialState: OnboardingState;
};

function OnboardingStepIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <h1 className={marketingFlowTitleClassName}>{title}</h1>
      <p className={marketingFlowDescriptionClassName}>{description}</p>
    </>
  );
}

function OnboardingNextButton({
  onClick,
  disabled = false,
  loading = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="default"
      onClick={onClick}
      disabled={disabled || loading}
      className="h-10 gap-1.5 rounded-full px-5 text-[13px] shadow-sm"
    >
      {loading ? "Saving…" : "Next"}
      {!loading ? <ArrowRight className="size-4" strokeWidth={1.5} /> : null}
    </Button>
  );
}

export function OnboardingFlow({ initialState }: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<OnboardingStepDirection>("forward");
  const [name, setName] = useState(initialState.displayName ?? "");
  const [ageRange, setAgeRange] = useState(initialState.ageRange ?? "");
  const [userLanguages, setUserLanguages] = useState<UserLanguageEntry[]>(
    initialState.languages.length > 0 ? initialState.languages : [],
  );
  const [availableLanguages, setAvailableLanguages] = useState<Lang[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const [addingLanguage, setAddingLanguage] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [newLangLevel, setNewLangLevel] = useState<OnboardingLanguageLevel | "">(
    "",
  );

  const goToStep = useCallback((next: number) => {
    setDirection(next > step ? "forward" : "back");
    setStep(next);
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/languages");
        const data = (await res.json()) as {
          error?: string;
          languages?: Lang[];
        };
        if (!res.ok) {
          if (!cancelled) setError(data.error ?? "Could not load languages");
          return;
        }

        const merged = mergeProfileCodes(data.languages ?? [], "en", "fr");
        const sorted = [...merged].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        );
        if (!cancelled) setAvailableLanguages(sorted);
      } catch {
        if (!cancelled) setError("Could not load languages");
      } finally {
        if (!cancelled) setLoadingLanguages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const getLanguageName = useCallback(
    (code: string) => resolveLanguageLabel(code, availableLanguages),
    [availableLanguages],
  );

  const primaryLanguageName = useMemo(() => {
    if (userLanguages.length === 0) return "";
    return getLanguageName(userLanguages[0].languageCode);
  }, [userLanguages, getLanguageName]);

  const completionHeading = useMemo(() => {
    const trimmed = name.trim();
    return trimmed.length > 0 ? `You're all set, ${trimmed}!` : "You're all set!";
  }, [name]);

  const unusedLanguages = useMemo(() => {
    const usedCodes = new Set(userLanguages.map((l) => l.languageCode));
    return availableLanguages.filter((l) => !usedCodes.has(l.code));
  }, [availableLanguages, userLanguages]);

  function addLanguage() {
    if (!newLangCode || !newLangLevel) return;
    setUserLanguages((prev) => [
      ...prev,
      { languageCode: newLangCode, level: newLangLevel },
    ]);
    setNewLangCode("");
    setNewLangLevel("");
    setAddingLanguage(false);
  }

  function removeLanguage(code: string) {
    setUserLanguages((prev) => prev.filter((l) => l.languageCode !== code));
  }

  function updateLanguageLevel(code: string, level: OnboardingLanguageLevel) {
    setUserLanguages((prev) =>
      prev.map((l) => (l.languageCode === code ? { ...l, level } : l)),
    );
  }

  async function finishOnboarding() {
    if (userLanguages.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          ageRange: ageRange || undefined,
          languages: userLanguages,
        }),
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not save onboarding");
        return;
      }
      setDirection("forward");
      setCompleted(true);
    } catch {
      setError("Could not save onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <OnboardingShell showProgress={false} error={error}>
        <OnboardingStepTransition step={0} direction="forward">
          <p className={cn("mb-3", marketingFlowEyebrowClassName)}>
            Setup complete
          </p>
          <h1 className={marketingFlowTitleClassName}>{completionHeading}</h1>
          <p className={marketingFlowDescriptionClassName}>
            Your journal is ready. Start writing and use{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {"//"}
            </code>{" "}
            anytime you want to translate a word or phrase into{" "}
            {primaryLanguageName}.
          </p>
          <Button
            onClick={() => router.push("/app/journal")}
            className="mt-8 h-12 rounded-full px-8 text-[15px] shadow-sm"
          >
            Start journaling
          </Button>
        </OnboardingStepTransition>
      </OnboardingShell>
    );
  }

  if (step === 1) {
    return (
      <OnboardingShell
        step={step}
        questionCount={ONBOARDING_QUESTION_COUNT}
        error={error}
        footer={
          <>
            <span aria-hidden className="min-w-[3rem]" />
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className={marketingFlowNavButtonClassName}
              >
                Skip
              </button>
              {name.trim() ? (
                <OnboardingNextButton onClick={() => goToStep(2)} />
              ) : null}
            </div>
          </>
        }
      >
        <OnboardingStepTransition step={step} direction={direction}>
          <OnboardingStepIntro
            title="What's your name?"
            description="This is just for personalizing your experience."
          />
          <input
            type="text"
            value={name}
            maxLength={50}
            placeholder="Your name or nickname..."
            className={cn(marketingFlowFieldClassName, "mt-8")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToStep(2);
            }}
          />
        </OnboardingStepTransition>
      </OnboardingShell>
    );
  }

  if (step === 2) {
    return (
      <OnboardingShell
        step={step}
        questionCount={ONBOARDING_QUESTION_COUNT}
        error={error}
        footer={
          <>
            <button
              type="button"
              onClick={() => goToStep(1)}
              className={marketingFlowNavButtonClassName}
            >
              Back
            </button>
            {ageRange ? (
              <OnboardingNextButton onClick={() => goToStep(3)} />
            ) : (
              <button
                type="button"
                onClick={() => goToStep(3)}
                className={marketingFlowNavButtonClassName}
              >
                Skip
              </button>
            )}
          </>
        }
      >
        <OnboardingStepTransition step={step} direction={direction}>
          <OnboardingStepIntro
            title="How old are you?"
            description="This helps us tailor prompts and suggestions to you. Your answers are anonymous."
          />
          <div className="relative mt-8">
            <select
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className={cn(
                marketingFlowFieldClassName,
                "cursor-pointer appearance-none pr-12",
              )}
            >
              <option value="">Select age range...</option>
              {ONBOARDING_AGE_RANGES.map((value) => (
                <option key={value} value={value}>
                  {AGE_RANGE_LABELS[value]}
                </option>
              ))}
            </select>
            <svg
              className={cn(selectChevronClass, "right-5")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </OnboardingStepTransition>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={step}
      questionCount={ONBOARDING_QUESTION_COUNT}
      wideContent
      error={error}
      footer={
        <>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className={marketingFlowNavButtonClassName}
          >
            Back
          </button>
          {userLanguages.length > 0 ? (
            <OnboardingNextButton
              onClick={() => void finishOnboarding()}
              loading={submitting}
            />
          ) : (
            <span aria-hidden className="min-w-[3rem]" />
          )}
        </>
      }
    >
      <OnboardingStepTransition step={step} direction={direction}>
        <OnboardingStepIntro
          title="What languages are you learning?"
          description="Add at least one language. You can always update this later."
        />

        {userLanguages.length > 0 ? (
          <div className="mt-8 w-full space-y-3">
            {userLanguages.map((lang) => (
              <div
                key={lang.languageCode}
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[15px] font-medium text-foreground">
                    {getLanguageName(lang.languageCode)}
                  </p>
                </div>
                <div className="relative">
                  <select
                    value={lang.level}
                    onChange={(e) =>
                      updateLanguageLevel(
                        lang.languageCode,
                        e.target.value as OnboardingLanguageLevel,
                      )
                    }
                    className="h-9 cursor-pointer appearance-none rounded-full border border-border/80 bg-background pl-3 pr-8 text-[13px] text-foreground outline-none"
                  >
                    {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {LANGUAGE_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <svg
                    className={cn(selectChevronClass, "right-2.5 size-3")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(lang.languageCode)}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  aria-label={`Remove ${getLanguageName(lang.languageCode)}`}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {addingLanguage ? (
          <div className="mt-4 w-full rounded-2xl border-2 border-dashed border-border/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <select
                  value={newLangCode}
                  onChange={(e) => setNewLangCode(e.target.value)}
                  disabled={loadingLanguages}
                  className={cn(
                    marketingFlowFieldClassName,
                    "cursor-pointer appearance-none pr-10 text-[14px] disabled:opacity-50",
                  )}
                >
                  <option value="">
                    {loadingLanguages ? "Loading..." : "Select language..."}
                  </option>
                  {unusedLanguages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <svg
                  className={cn(selectChevronClass, "right-4")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <div className="relative min-w-0 flex-1">
                <select
                  value={newLangLevel}
                  onChange={(e) =>
                    setNewLangLevel(e.target.value as OnboardingLanguageLevel)
                  }
                  className={cn(
                    marketingFlowFieldClassName,
                    "cursor-pointer appearance-none pr-10 text-[14px]",
                  )}
                >
                  <option value="">Select level...</option>
                  {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {LEVEL_COPY[level].title} — {LEVEL_COPY[level].description}
                    </option>
                  ))}
                </select>
                <svg
                  className={cn(selectChevronClass, "right-4")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddingLanguage(false);
                  setNewLangCode("");
                  setNewLangLevel("");
                }}
                className={marketingFlowNavButtonClassName}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLanguage}
                disabled={!newLangCode || !newLangLevel}
                className="rounded-full bg-foreground px-4 py-2 text-[13px] font-medium text-background transition-opacity disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingLanguage(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 py-3 text-[14px] text-muted-foreground shadow-sm transition-colors hover:border-sidebar-primary/30 hover:text-foreground"
          >
            <Plus className="size-4" />
            Add a language
          </button>
        )}
      </OnboardingStepTransition>
    </OnboardingShell>
  );
}

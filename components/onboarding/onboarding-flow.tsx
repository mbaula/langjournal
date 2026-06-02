"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { OnboardingExitHeader } from "@/components/onboarding/onboarding-exit-header";
import type { OnboardingState, UserLanguageEntry } from "@/lib/db/onboarding";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/labels";

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

type OnboardingFlowProps = {
  initialState: OnboardingState;
  previewMode?: boolean;
};

export function OnboardingFlow({
  initialState,
  previewMode = false,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
  const [newLangLevel, setNewLangLevel] = useState<OnboardingLanguageLevel | "">("");

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
    (code: string) => {
      const match = availableLanguages.find((l) => l.code === code);
      return match?.name ?? code;
    },
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
      setCompleted(true);
    } catch {
      setError("Could not save onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-6 pb-16 pt-20">
      <OnboardingExitHeader previewMode={previewMode} />
      {previewMode ? (
        <p className="absolute inset-x-0 top-[max(4.5rem,env(safe-area-inset-top,0px))] z-10 px-6 text-center text-[12px] text-muted-foreground">
          Dev preview — pre-filled from your profile. Submit only if you want to
          save changes.
        </p>
      ) : null}
      {/* Completion */}
      {completed ? (
        <div className="flex flex-col items-center text-center">
          <h1 className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
            {completionHeading}
          </h1>
          <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
            Your journal is ready. Start writing and use{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
              {"//"}
            </code>{" "}
            anytime you want to translate a word or phrase into{" "}
            {primaryLanguageName}.
          </p>
          <Button
            onClick={() => router.push("/app/journal")}
            className="mt-8 h-12 rounded-full px-8 text-[15px]"
          >
            Start journaling
          </Button>
        </div>
      ) : null}

      {/* Step 1: Name */}
      {!completed && step === 1 ? (
        <>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
              What&apos;s your name?
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              This is just for personalizing your experience!
            </p>
            <input
              type="text"
              value={name}
              maxLength={50}
              placeholder="Your name or nickname..."
              className="mt-10 h-14 w-full max-w-xs rounded-full bg-muted/60 px-6 text-center text-[15px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:bg-muted/80 dark:bg-muted/40 dark:focus:bg-muted/50"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setStep(2);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="absolute right-6 bottom-8 text-[13px] text-muted-foreground hover:text-foreground transition-colors sm:right-10 sm:bottom-10"
          >
            Skip
          </button>
        </>
      ) : null}

      {/* Step 2: Age */}
      {!completed && step === 2 ? (
        <>
          <div className="flex flex-col items-center text-center">
            <h1 className="text-[2rem] font-semibold tracking-tight text-foreground sm:text-[2.5rem]">
              How old are you?
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              This helps us tailor prompts and suggestions to you.
            </p>
            <div className="relative mt-10 w-full max-w-xs">
              <select
                value={ageRange}
                onChange={(e) => setAgeRange(e.target.value)}
                className="h-14 w-full cursor-pointer appearance-none rounded-full bg-muted/60 pl-6 pr-12 text-center text-[15px] text-foreground outline-none transition-colors focus:bg-muted/80 dark:bg-muted/40 dark:focus:bg-muted/50"
              >
                <option value="">Select age range...</option>
                {ONBOARDING_AGE_RANGES.map((value) => (
                  <option key={value} value={value}>
                    {AGE_RANGE_LABELS[value]}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="absolute right-6 bottom-8 flex items-center gap-6 sm:right-10 sm:bottom-10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {ageRange ? "Continue" : "Skip"}
            </button>
          </div>
        </>
      ) : null}

      {/* Step 3: Languages */}
      {!completed && step === 3 ? (
        <>
          <div className="flex w-full max-w-lg flex-col items-center text-center">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-[2rem]">
              What languages are you learning?
            </h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Add at least one language. You can always update this later.
            </p>

            {/* Added languages */}
            {userLanguages.length > 0 ? (
              <div className="mt-8 w-full space-y-3">
                {userLanguages.map((lang) => (
                  <div
                    key={lang.languageCode}
                    className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4 dark:bg-muted/40"
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
                        className="h-9 cursor-pointer appearance-none rounded-full bg-background/80 pl-3 pr-8 text-[13px] text-foreground outline-none dark:bg-background/50"
                      >
                        {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {LANGUAGE_LEVEL_LABELS[level]}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang.languageCode)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
                      aria-label={`Remove ${getLanguageName(lang.languageCode)}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Add language form */}
            {addingLanguage ? (
              <div className="mt-4 w-full rounded-2xl border-2 border-dashed border-border/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={newLangCode}
                      onChange={(e) => setNewLangCode(e.target.value)}
                      disabled={loadingLanguages}
                      className="h-12 w-full cursor-pointer appearance-none rounded-full bg-muted/60 pl-4 pr-10 text-[14px] text-foreground outline-none transition-colors focus:bg-muted/80 disabled:opacity-50 dark:bg-muted/40"
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
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative flex-1">
                    <select
                      value={newLangLevel}
                      onChange={(e) => setNewLangLevel(e.target.value as OnboardingLanguageLevel)}
                      className="h-12 w-full cursor-pointer appearance-none rounded-full bg-muted/60 pl-4 pr-10 text-[14px] text-foreground outline-none transition-colors focus:bg-muted/80 dark:bg-muted/40"
                    >
                      <option value="">Select level...</option>
                      {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {LEVEL_COPY[level].title} — {LEVEL_COPY[level].description}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
                    className="rounded-full px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
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
                className="mt-6 flex items-center gap-2 rounded-full bg-muted/60 px-5 py-3 text-[14px] text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground dark:bg-muted/40 dark:hover:bg-muted/50"
              >
                <Plus className="h-4 w-4" />
                Add a language
              </button>
            )}
          </div>

          <div className="absolute right-6 bottom-8 flex items-center gap-6 sm:right-10 sm:bottom-10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
            {userLanguages.length > 0 ? (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void finishOnboarding()}
                className="text-[13px] font-medium text-foreground hover:text-foreground/80 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Continue"}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Error */}
      {error ? (
        <p className="absolute bottom-20 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

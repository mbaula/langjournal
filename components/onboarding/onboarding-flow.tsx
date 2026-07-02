"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  marketingFlowDescriptionClassName,
  marketingFlowEyebrowClassName,
  marketingFlowFieldClassName,
  marketingFlowNavButtonClassName,
  marketingFlowTitleClassName,
  marketingHeroCtaClassName,
} from "@/components/marketing/marketing-flow-styles";
import { LanguageSearchCombobox } from "@/components/languages/language-search-combobox";
import { ProficiencyLevelSelect } from "@/components/languages/proficiency-level-select";
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
import { useOnboardingLabels } from "@/lib/i18n/hooks";
import { getLocalizedLanguageDisplayName } from "@/lib/i18n/language-display-name";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";
import {
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/labels";
import { cn } from "@/lib/utils";

type Lang = { code: string; name: string };

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
  label,
  loadingLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  loadingLabel: string;
}) {
  return (
    <Button
      type="button"
      variant="default"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(marketingHeroCtaClassName, "h-10 px-5 text-sm")}
    >
      {loading ? loadingLabel : label}
      {!loading ? <ArrowRight className="size-4" strokeWidth={1.5} /> : null}
    </Button>
  );
}

export function OnboardingFlow({ initialState }: OnboardingFlowProps) {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const { languageLevelLabels, ageRangeLabels, levelDescriptions } =
    useOnboardingLabels();
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
          if (!cancelled) setError(data.error ?? t("loadLanguagesError"));
          return;
        }

        const merged = mergeProfileCodes(data.languages ?? [], "en", "fr");
        const sorted = [...merged].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        );
        if (!cancelled) setAvailableLanguages(sorted);
      } catch {
        if (!cancelled) setError(t("loadLanguagesError"));
      } finally {
        if (!cancelled) setLoadingLanguages(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const localizedLanguages = useMemo(
    () =>
      availableLanguages.map((language) => ({
        code: language.code,
        name: getLocalizedLanguageDisplayName(
          language.code,
          locale,
          availableLanguages,
        ),
      })),
    [availableLanguages, locale],
  );

  const getLanguageName = useCallback(
    (code: string) =>
      getLocalizedLanguageDisplayName(code, locale, availableLanguages),
    [availableLanguages, locale],
  );

  const levelOptions = useMemo(
    () =>
      ONBOARDING_LANGUAGE_LEVELS.map((level) => ({
        value: level,
        label: languageLevelLabels[level],
        description: levelDescriptions[level],
      })),
    [languageLevelLabels, levelDescriptions],
  );

  const compactLevelOptions = useMemo(
    () =>
      ONBOARDING_LANGUAGE_LEVELS.map((level) => ({
        value: level,
        label: languageLevelLabels[level],
      })),
    [languageLevelLabels],
  );

  const primaryLanguageName = useMemo(() => {
    if (userLanguages.length === 0) return "";
    return getLanguageName(userLanguages[0].languageCode);
  }, [userLanguages, getLanguageName]);

  const completionHeading = useMemo(() => {
    const trimmed = name.trim();
    return trimmed.length > 0
      ? t("completionHeading", { name: trimmed })
      : t("completionHeadingFallback");
  }, [name, t]);

  const unusedLanguages = useMemo(() => {
    const usedCodes = new Set(userLanguages.map((l) => l.languageCode));
    return localizedLanguages.filter((l) => !usedCodes.has(l.code));
  }, [localizedLanguages, userLanguages]);

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
        setError(data.error ?? t("saveError"));
        return;
      }
      setDirection("forward");
      setCompleted(true);
    } catch {
      setError(t("saveError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <OnboardingShell showProgress={false} error={error}>
        <OnboardingStepTransition step={0} direction="forward">
          <p className={cn("mb-3", marketingFlowEyebrowClassName)}>
            {t("setupComplete")}
          </p>
          <h1 className={marketingFlowTitleClassName}>{completionHeading}</h1>
          <p className={marketingFlowDescriptionClassName}>
            {t("completionDescription", {
              slash: "//",
              language: primaryLanguageName,
            })}
          </p>
          <Button
            onClick={() => router.push("/app/journal")}
            className={cn(marketingHeroCtaClassName, "mt-8 px-8 text-base")}
          >
            {t("startJournaling")}
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
                {t("skip")}
              </button>
              {name.trim() ? (
                <OnboardingNextButton
                  onClick={() => goToStep(2)}
                  label={t("next")}
                  loadingLabel={t("saving")}
                />
              ) : null}
            </div>
          </>
        }
      >
        <OnboardingStepTransition step={step} direction={direction}>
          <OnboardingStepIntro
            title={t("name.title")}
            description={t("name.description")}
          />
          <input
            type="text"
            value={name}
            placeholder={t("name.placeholder")}
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
              {t("back")}
            </button>
            {ageRange ? (
              <OnboardingNextButton
                onClick={() => goToStep(3)}
                label={t("next")}
                loadingLabel={t("saving")}
              />
            ) : (
              <button
                type="button"
                onClick={() => goToStep(3)}
                className={marketingFlowNavButtonClassName}
              >
                {t("skip")}
              </button>
            )}
          </>
        }
      >
        <OnboardingStepTransition step={step} direction={direction}>
          <OnboardingStepIntro
            title={t("age.title")}
            description={t("age.description")}
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
              <option value="">{t("age.placeholder")}</option>
              {ONBOARDING_AGE_RANGES.map((value) => (
                <option key={value} value={value}>
                  {ageRangeLabels[value]}
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
            {t("back")}
          </button>
          {userLanguages.length > 0 ? (
            <OnboardingNextButton
              onClick={() => void finishOnboarding()}
              loading={submitting}
              label={t("next")}
              loadingLabel={t("saving")}
            />
          ) : (
            <span aria-hidden className="min-w-[3rem]" />
          )}
        </>
      }
    >
      <OnboardingStepTransition step={step} direction={direction}>
        <OnboardingStepIntro
          title={t("languages.title")}
          description={t("languages.description")}
        />

        {userLanguages.length > 0 ? (
          <div className="mt-8 w-full space-y-3">
            {userLanguages.map((lang) => (
              <div
                key={lang.languageCode}
                className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/80 p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-base font-medium text-foreground">
                    {getLanguageName(lang.languageCode)}
                  </p>
                </div>
                <ProficiencyLevelSelect
                  value={lang.level}
                  onChange={(level) =>
                    updateLanguageLevel(
                      lang.languageCode,
                      level as OnboardingLanguageLevel,
                    )
                  }
                  options={compactLevelOptions}
                  className="w-auto min-w-[9rem]"
                  triggerClassName="h-9 px-3"
                  placeholder={t("languages.selectLevel")}
                  aria-label={t("languages.levelFor", {
                    language: getLanguageName(lang.languageCode),
                  })}
                />
                <button
                  type="button"
                  onClick={() => removeLanguage(lang.languageCode)}
                  className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  aria-label={t("languages.removeLanguage", {
                    language: getLanguageName(lang.languageCode),
                  })}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {addingLanguage ? (
          <div className="mt-4 w-full rounded-2xl border-2 border-dashed border-border/60 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[3fr_2fr] sm:items-start">
              <LanguageSearchCombobox
                options={unusedLanguages}
                value={newLangCode}
                onChange={setNewLangCode}
                disabled={loadingLanguages}
                placeholder={
                  loadingLanguages
                    ? t("languages.loadingLanguages")
                    : t("languages.searchPlaceholder")
                }
                inputAriaLabel={t("languages.languageLabel")}
              />
              <ProficiencyLevelSelect
                value={newLangLevel}
                onChange={(level) =>
                  setNewLangLevel(level as OnboardingLanguageLevel)
                }
                options={levelOptions}
                placeholder={t("languages.selectLevel")}
              />
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
                {t("cancel")}
              </button>
              <button
                type="button"
                onClick={addLanguage}
                disabled={!newLangCode || !newLangLevel}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity disabled:opacity-40"
              >
                {t("add")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingLanguage(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-5 py-3 text-sm text-muted-foreground shadow-sm transition-colors hover:border-sidebar-primary/30 hover:text-foreground"
          >
            <Plus className="size-4" />
            {t("languages.addLanguage")}
          </button>
        )}
      </OnboardingStepTransition>
    </OnboardingShell>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSearchCombobox } from "@/components/languages/language-search-combobox";
import { ProficiencyLevelSelect } from "@/components/languages/proficiency-level-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";
import {
  settingsFieldRowClassName,
  settingsFieldRowStartClassName,
  settingsInputClassName,
  settingsLanguageComboboxInputClassName,
  settingsLanguagePickerTriggerClassName,
} from "@/components/settings/settings-field-styles";
import type { OnboardingState, UserLanguageEntry } from "@/lib/db/onboarding";
import { useOnboardingLabels } from "@/lib/i18n/hooks";
import { getLocalizedLanguageDisplayName } from "@/lib/i18n/language-display-name";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";
import { ONBOARDING_LANGUAGE_LEVELS } from "@/lib/onboarding/labels";

type Lang = { code: string; name: string };

type ProfileSettingsFormProps = {
  initialState: OnboardingState;
};

export function ProfileSettingsForm({ initialState }: ProfileSettingsFormProps) {
  const t = useTranslations("settings.profile");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { languageLevelLabels, levelDescriptions } = useOnboardingLabels();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialState.displayName ?? "");
  const [userLanguages, setUserLanguages] = useState<UserLanguageEntry[]>(
    initialState.languages,
  );
  const [availableLanguages, setAvailableLanguages] = useState<Lang[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [addingLanguage, setAddingLanguage] = useState(false);
  const [newLangCode, setNewLangCode] = useState("");
  const [newLangLevel, setNewLangLevel] = useState<OnboardingLanguageLevel | "">(
    "",
  );

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

  const unusedLanguages = useMemo(() => {
    const usedCodes = new Set(userLanguages.map((l) => l.languageCode));
    return localizedLanguages.filter((l) => !usedCodes.has(l.code));
  }, [localizedLanguages, userLanguages]);

  const addLanguage = () => {
    if (!newLangCode || !newLangLevel) return;
    setUserLanguages((prev) => [
      ...prev,
      { languageCode: newLangCode, level: newLangLevel },
    ]);
    setNewLangCode("");
    setNewLangLevel("");
    setAddingLanguage(false);
  };

  const removeLanguage = (code: string) => {
    setUserLanguages((prev) => prev.filter((l) => l.languageCode !== code));
  };

  const updateLanguageLevel = (code: string, level: OnboardingLanguageLevel) => {
    setUserLanguages((prev) =>
      prev.map((l) => (l.languageCode === code ? { ...l, level } : l)),
    );
  };

  const save = useCallback(async () => {
    if (userLanguages.length === 0) {
      setError(t("addLanguageError"));
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          languages: userLanguages,
        }),
      });
      const data = (await res.json()) as OnboardingState & { error?: string };
      if (!res.ok) {
        setError(data.error ?? t("saveFailed"));
        return;
      }
      setDisplayName(data.displayName ?? "");
      setUserLanguages(data.languages);
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [displayName, router, t, userLanguages]);

  return (
    <SettingsSection title={t("title")}>
      <SettingsPanelRow>
        <div className={settingsFieldRowClassName}>
          <Label htmlFor="profile-display-name">{t("name")}</Label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className={settingsInputClassName}
          />
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">{t("languages")}</Label>
          <div className="min-w-0 space-y-3">

            {userLanguages.length > 0 ? (
              <ul className="space-y-2">
                {userLanguages.map((lang) => (
                  <li
                    key={lang.languageCode}
                    className="flex items-center gap-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {getLanguageName(lang.languageCode)}
                    </span>
                    <ProficiencyLevelSelect
                      value={lang.level}
                      onChange={(level) =>
                        updateLanguageLevel(
                          lang.languageCode,
                          level as OnboardingLanguageLevel,
                        )
                      }
                      options={compactLevelOptions}
                      className="w-auto min-w-[9rem] shrink-0"
                      triggerClassName={settingsLanguagePickerTriggerClassName}
                      dropdownClassName="shadow-none"
                      placeholder={t("selectLevel")}
                      aria-label={t("levelFor", {
                        language: getLanguageName(lang.languageCode),
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang.languageCode)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label={t("removeLanguage", {
                        language: getLanguageName(lang.languageCode),
                      })}
                    >
                      <X className="size-3.5" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("noLanguages")}</p>
            )}

            {addingLanguage ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[3fr_2fr] sm:items-start">
                  <LanguageSearchCombobox
                    options={unusedLanguages}
                    value={newLangCode}
                    onChange={setNewLangCode}
                    disabled={loadingLanguages}
                    placeholder={
                      loadingLanguages ? tCommon("loading") : t("searchPlaceholder")
                    }
                    inputAriaLabel={t("languageLabel")}
                    inputClassName={settingsLanguageComboboxInputClassName}
                    searchIconClassName="left-3"
                    dropdownClassName="shadow-none"
                  />
                  <ProficiencyLevelSelect
                    value={newLangLevel}
                    onChange={(level) =>
                      setNewLangLevel(level as OnboardingLanguageLevel)
                    }
                    options={levelOptions}
                    placeholder={t("selectLevel")}
                    triggerClassName={settingsLanguagePickerTriggerClassName}
                    dropdownClassName="shadow-none"
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newLangCode || !newLangLevel}
                    onClick={addLanguage}
                  >
                    {t("add")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddingLanguage(false);
                      setNewLangCode("");
                      setNewLangLevel("");
                    }}
                  >
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loadingLanguages || unusedLanguages.length === 0}
                onClick={() => setAddingLanguage(true)}
              >
                <Plus className="size-4" strokeWidth={1.5} />
                {t("addLanguage")}
              </Button>
            )}
          </div>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowClassName}>
          <div aria-hidden="true" />
          <div className="flex flex-wrap items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-muted-foreground">{tCommon("saved")}</span>
            )}
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? tCommon("saving") : t("saveProfile")}
            </Button>
          </div>
        </div>
      </SettingsPanelRow>

      {error ? (
        <SettingsPanelRow>
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        </SettingsPanelRow>
      ) : null}
    </SettingsSection>
  );
}

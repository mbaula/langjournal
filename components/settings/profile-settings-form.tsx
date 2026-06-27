"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

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
  settingsSelectClassName,
} from "@/components/settings/settings-field-styles";
import type { OnboardingState, UserLanguageEntry } from "@/lib/db/onboarding";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import {
  LANGUAGE_LEVEL_LABELS,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/labels";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";

type Lang = { code: string; name: string };

type ProfileSettingsFormProps = {
  initialState: OnboardingState;
};

export function ProfileSettingsForm({ initialState }: ProfileSettingsFormProps) {
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

  const unusedLanguages = useMemo(() => {
    const usedCodes = new Set(userLanguages.map((l) => l.languageCode));
    return availableLanguages.filter((l) => !usedCodes.has(l.code));
  }, [availableLanguages, userLanguages]);

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
      setError("Add at least one language you are learning.");
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
        setError(data.error ?? "Save failed");
        return;
      }
      setDisplayName(data.displayName ?? "");
      setUserLanguages(data.languages);
      setSaved(true);
      router.refresh();
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [displayName, router, userLanguages]);

  return (
    <SettingsSection title="Profile">
      <SettingsPanelRow>
        <div className={settingsFieldRowClassName}>
          <Label htmlFor="profile-display-name">Name</Label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name or nickname"
            className={settingsInputClassName}
          />
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowStartClassName}>
          <Label className="pt-2">Languages</Label>
          <div className="min-w-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              The first language is used as your default learning target in the
              journal.
            </p>

            {userLanguages.length > 0 ? (
              <ul className="space-y-2">
                {userLanguages.map((lang) => (
                  <li
                    key={lang.languageCode}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 sm:flex-row sm:items-center"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                      {getLanguageName(lang.languageCode)}
                    </span>
                    <select
                      value={lang.level}
                      onChange={(e) =>
                        updateLanguageLevel(
                          lang.languageCode,
                          e.target.value as OnboardingLanguageLevel,
                        )
                      }
                      className="h-8 shrink-0 cursor-pointer rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
                    >
                      {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {LANGUAGE_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang.languageCode)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      aria-label={`Remove ${getLanguageName(lang.languageCode)}`}
                    >
                      <X className="size-4" strokeWidth={1.5} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No languages added yet.
              </p>
            )}

            {addingLanguage ? (
              <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                    disabled={loadingLanguages}
                    className={settingsSelectClassName}
                  >
                    <option value="">
                      {loadingLanguages ? "Loading…" : "Select language…"}
                    </option>
                    {unusedLanguages.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newLangLevel}
                    onChange={(e) =>
                      setNewLangLevel(e.target.value as OnboardingLanguageLevel)
                    }
                    className={settingsSelectClassName}
                  >
                    <option value="">Select level…</option>
                    {ONBOARDING_LANGUAGE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {LANGUAGE_LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newLangCode || !newLangLevel}
                    onClick={addLanguage}
                  >
                    Add
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
                    Cancel
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
                Add language
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
              <span className="text-sm text-muted-foreground">Saved.</span>
            )}
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
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

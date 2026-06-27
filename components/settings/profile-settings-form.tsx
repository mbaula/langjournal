"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OnboardingState, UserLanguageEntry } from "@/lib/db/onboarding";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";
import {
  AGE_RANGE_LABELS,
  LANGUAGE_LEVEL_LABELS,
  ONBOARDING_AGE_RANGES,
  ONBOARDING_LANGUAGE_LEVELS,
} from "@/lib/onboarding/labels";
import type { OnboardingLanguageLevel } from "@/lib/onboarding/constants";

type Lang = { code: string; name: string };

type ProfileSettingsFormProps = {
  initialState: OnboardingState;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

const selectClass = `${fieldClass} cursor-pointer`;

export function ProfileSettingsForm({ initialState }: ProfileSettingsFormProps) {
  const [displayName, setDisplayName] = useState(initialState.displayName ?? "");
  const [ageRange, setAgeRange] = useState(initialState.ageRange ?? "");
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
          ageRange: ageRange || undefined,
          languages: userLanguages,
        }),
      });
      const data = (await res.json()) as OnboardingState & { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      setDisplayName(data.displayName ?? "");
      setAgeRange(data.ageRange ?? "");
      setUserLanguages(data.languages);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [ageRange, displayName, userLanguages]);

  return (
    <section className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Name, age range, and languages you are learning — the same details from
          onboarding.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-background/80 p-5 shadow-sm">
        <div className="flex flex-col gap-5">
          <div>
            <Label htmlFor="profile-display-name">Name</Label>
            <input
              id="profile-display-name"
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name or nickname"
              className={fieldClass}
            />
          </div>

          <div>
            <Label htmlFor="profile-age-range">Age range</Label>
            <select
              id="profile-age-range"
              value={ageRange}
              onChange={(e) => setAgeRange(e.target.value)}
              className={selectClass}
            >
              <option value="">Not specified</option>
              {ONBOARDING_AGE_RANGES.map((value) => (
                <option key={value} value={value}>
                  {AGE_RANGE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Languages you are learning</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              The first language is used as your default learning target in the
              journal.
            </p>

            {userLanguages.length > 0 ? (
              <ul className="mt-3 space-y-2">
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
              <p className="mt-2 text-sm text-muted-foreground">
                No languages added yet.
              </p>
            )}

            {addingLanguage ? (
              <div className="mt-3 space-y-3 rounded-lg border border-dashed border-border p-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <select
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                    disabled={loadingLanguages}
                    className={selectClass}
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
                    className={selectClass}
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
                className="mt-3"
                disabled={loadingLanguages || unusedLanguages.length === 0}
                onClick={() => setAddingLanguage(true)}
              >
                <Plus className="size-4" strokeWidth={1.5} />
                Add language
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
          {saved && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

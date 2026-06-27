"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  SettingsPanelRow,
  SettingsSection,
} from "@/components/settings/settings-panel";
import {
  settingsFieldRowClassName,
  settingsSelectClassName,
} from "@/components/settings/settings-field-styles";
import { mergeProfileCodes } from "@/lib/languages/merge-profile-codes";

type Lang = { code: string; name: string };

type LanguageProfileFormProps = {
  initialNative: string;
  initialTarget: string;
};

export function LanguageProfileForm({
  initialNative,
  initialTarget,
}: LanguageProfileFormProps) {
  const [languages, setLanguages] = useState<Lang[] | null>(null);
  const [nativeLanguage, setNativeLanguage] = useState(initialNative);
  const [targetLanguage, setTargetLanguage] = useState(initialTarget);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const nativeRef = useRef(nativeLanguage);
  const targetRef = useRef(targetLanguage);
  nativeRef.current = nativeLanguage;
  targetRef.current = targetLanguage;

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
        if (!cancelled && data.languages?.length) {
          setLanguages(
            mergeProfileCodes(
              data.languages,
              nativeRef.current,
              targetRef.current,
            ),
          );
        }
      } catch {
        if (!cancelled) setError("Could not load languages");
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(() => {
    if (languages?.length) {
      return mergeProfileCodes(languages, nativeLanguage, targetLanguage);
    }
    return mergeProfileCodes([], nativeLanguage, targetLanguage);
  }, [languages, nativeLanguage, targetLanguage]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/language-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nativeLanguage,
          targetLanguage,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        nativeLanguage?: string;
        targetLanguage?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Save failed");
        return;
      }
      if (data.nativeLanguage) setNativeLanguage(data.nativeLanguage);
      if (data.targetLanguage) setTargetLanguage(data.targetLanguage);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Save failed");
    } finally {
      setSaving(false);
    }
  }, [nativeLanguage, targetLanguage]);

  return (
    <SettingsSection title="Translation">
      <SettingsPanelRow>
        <div className={settingsFieldRowClassName}>
          <Label htmlFor="native-language">Native</Label>
          <select
            id="native-language"
            className={settingsSelectClassName}
            disabled={loadingList}
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
          >
            {options.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className={settingsFieldRowClassName}>
          <Label htmlFor="target-language">Learning</Label>
          <select
            id="target-language"
            className={settingsSelectClassName}
            disabled={loadingList}
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            {options.map((l) => (
              <option key={`t-${l.code}`} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-muted-foreground">Saved.</span>
          )}
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save translation"}
          </Button>
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

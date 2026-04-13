"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

  const selectClass =
    "mt-1.5 w-full max-w-md rounded-lg border border-border/80 bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35 disabled:opacity-60";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Languages</h1>
        <p className="text-sm text-muted-foreground">
          Text after{" "}
          <code className="rounded bg-muted px-1 text-xs">//</code> is your
          native language; it is translated into the language you are learning.
          The dropdown list is loaded from Google when translation is
          configured; otherwise a built-in subset is used.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <Label htmlFor="native-language">Native (source)</Label>
            <select
              id="native-language"
              className={selectClass}
              disabled={loadingList}
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
            >
              {options.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="target-language">Learning (target)</Label>
            <select
              id="target-language"
              className={selectClass}
              disabled={loadingList}
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
            >
              {options.map((l) => (
                <option key={`t-${l.code}`} value={l.code}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
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
    </div>
  );
}

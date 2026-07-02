"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const AUTOSAVE_MS = 800;

type EntryTitleFieldProps = {
  entryId: string;
  initialTitle: string | null;
  inputId?: string;
  className?: string;
  onTitleChange?: (title: string) => void;
};

export function EntryTitleField({
  entryId,
  initialTitle,
  inputId,
  className,
  onTitleChange,
}: EntryTitleFieldProps) {
  const t = useTranslations("journal");
  const router = useRouter();
  const [value, setValue] = useState(initialTitle?.trim() ?? "");
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    setValue(initialTitle?.trim() ?? "");
  }, [initialTitle, entryId]);

  const patch = useCallback(
    async (title: string) => {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        router.refresh();
      }
    },
    [entryId, router],
  );

  const patchRef = useRef(patch);
  patchRef.current = patch;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void patch(value);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [value, patch]);

  useEffect(() => {
    return () => {
      void patchRef.current(valueRef.current);
    };
  }, []);

  return (
    <input
      id={inputId}
      type="text"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onTitleChange?.(e.target.value);
      }}
      placeholder={t("entryTitlePlaceholder")}
      aria-label={t("entryTitle")}
      className={cn(
        "font-sans w-full min-w-0 border-0 bg-transparent py-0 leading-[1.15] text-foreground outline-none transition-colors",
        "placeholder:text-muted-foreground/50 dark:placeholder:text-foreground/65",
        "focus-visible:ring-0",
        className,
      )}
    />
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { journalTextareaClassName } from "@/components/journal/field-styles";

const AUTOSAVE_MS = 900;

type EditableTextBlockProps = {
  blockId: string;
  initialText: string;
  onSaveError?: (message: string) => void;
};

export function EditableTextBlock({
  blockId,
  initialText,
  onSaveError,
}: EditableTextBlockProps) {
  const [text, setText] = useState(initialText);
  const textRef = useRef(text);
  textRef.current = text;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (document.activeElement === textareaRef.current) {
      return;
    }
    setText(initialText);
  }, [blockId, initialText]);

  const patch = useCallback(
    async (body: string) => {
      const res = await fetch(`/api/blocks/${blockId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        onSaveError?.(data.error ?? "Could not save");
      }
    },
    [blockId, onSaveError],
  );

  const patchRef = useRef(patch);
  patchRef.current = patch;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void patch(text);
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [text, patch]);

  useEffect(() => {
    return () => {
      void patchRef.current(textRef.current);
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      rows={5}
      aria-label="Journal text block"
      className={journalTextareaClassName(
        "min-h-[5.5rem] border-0 bg-transparent shadow-none focus-visible:ring-offset-0",
      )}
    />
  );
}

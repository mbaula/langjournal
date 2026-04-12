"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";

import { EditableTextBlock } from "@/components/journal/editable-text-block";
import {
  journalBlockShellClassName,
  journalTextareaClassName,
} from "@/components/journal/field-styles";
import { Button } from "@/components/ui/button";

export type SerializedTextBlock = {
  id: string;
  sourceText: string;
  createdAt: string;
};

const AUTOSAVE_MS = 900;

type BlockComposerProps = {
  entryId: string;
  blocks: SerializedTextBlock[];
};

export function BlockComposer({ entryId, blocks }: BlockComposerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(blocks.length === 0);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const composerRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (addOpen && composerRef.current) {
      composerRef.current.focus();
    }
  }, [addOpen]);

  const postingRef = useRef(false);

  const saveNewBlock = useCallback(async () => {
    if (postingRef.current) {
      return;
    }
    const raw = draftRef.current;
    const trimmed = raw.replace(/\r\n/g, "\n").trim();
    if (!trimmed) {
      return;
    }

    postingRef.current = true;
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }

      setDraft("");
      setAddOpen(false);
      router.refresh();
    } finally {
      postingRef.current = false;
    }
  }, [entryId, router]);

  useEffect(() => {
    if (!addOpen) {
      return;
    }
    const trimmed = draft.replace(/\r\n/g, "\n").trim();
    if (!trimmed) {
      return;
    }
    const handle = window.setTimeout(() => {
      void saveNewBlock();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(handle);
  }, [addOpen, draft, saveNewBlock]);

  const onBlockError = useCallback((message: string) => {
    setError(message);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col gap-8">
      {blocks.length > 0 ? (
        <ol className="flex flex-col gap-3" aria-label="Saved blocks">
          {blocks.map((block) => (
            <li key={block.id} className={journalBlockShellClassName()}>
              <EditableTextBlock
                blockId={block.id}
                initialText={block.sourceText}
                onSaveError={onBlockError}
              />
            </li>
          ))}
        </ol>
      ) : null}

      <div className="flex flex-col gap-2" aria-label="Add block">
        {addOpen ? (
          <div className={journalBlockShellClassName()}>
            <textarea
              ref={composerRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              aria-label="New journal block"
              className={journalTextareaClassName(
                "min-h-[42vh] border-0 bg-transparent shadow-none focus-visible:ring-offset-0",
              )}
            />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-dashed py-8 text-muted-foreground"
            onClick={() => {
              setError(null);
              setAddOpen(true);
            }}
          >
            Add another entry
          </Button>
        )}
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

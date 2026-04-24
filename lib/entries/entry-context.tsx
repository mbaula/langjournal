"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type InlineTranslation } from "@/components/journal/journal-editor";

export type JournalEntry = {
  id: string;
  title: string | null;
  body: string | null;
  translations: InlineTranslation[];
  entryDate: string;
  createdAt: string;
  updatedAt: string;
};

type EntryContextValue = {
  currentEntry: JournalEntry | null;
  isLoading: boolean;
  error: string | null;
  switchEntry: (id: string) => void;
  refreshEntry: () => void;
  updateEntryInCache: (id: string, updates: Partial<JournalEntry>) => void;
  removeEntryFromCache: (id: string) => void;
};

const EntryContext = createContext<EntryContextValue | null>(null);

type EntryProviderProps = {
  children: React.ReactNode;
  initialEntry?: JournalEntry | null;
  initialEntryId?: string | null;
};

export function EntryProvider({
  children,
  initialEntry,
  initialEntryId,
}: EntryProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState<Map<string, JournalEntry>>(() => {
    const map = new Map<string, JournalEntry>();
    if (initialEntry) {
      map.set(initialEntry.id, initialEntry);
    }
    return map;
  });
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(
    initialEntryId ?? initialEntry?.id ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentEntry = currentEntryId ? entries.get(currentEntryId) ?? null : null;

  const fetchEntry = useCallback(async (id: string, signal?: AbortSignal) => {
    const res = await fetch(`/api/entries/${id}`, { signal });
    if (!res.ok) {
      throw new Error("Failed to fetch entry");
    }
    const data = (await res.json()) as { entry: JournalEntry };
    // Normalize translations to always be an array
    return {
      ...data.entry,
      translations: Array.isArray(data.entry.translations)
        ? data.entry.translations
        : [],
    };
  }, []);

  const switchEntry = useCallback(
    async (id: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const cached = entries.get(id);
      if (cached) {
        setCurrentEntryId(id);
        setError(null);
        router.replace(`/app/entry/${id}`, { scroll: false });
        return;
      }

      setIsLoading(true);
      setError(null);
      setCurrentEntryId(id);
      router.replace(`/app/entry/${id}`, { scroll: false });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const entry = await fetchEntry(id, controller.signal);
        setEntries((prev) => new Map(prev).set(id, entry));
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load entry");
      } finally {
        setIsLoading(false);
      }
    },
    [entries, fetchEntry, router]
  );

  const refreshEntry = useCallback(async () => {
    if (!currentEntryId) return;

    try {
      const entry = await fetchEntry(currentEntryId);
      setEntries((prev) => new Map(prev).set(currentEntryId, entry));
    } catch {
      // Silently fail on refresh
    }
  }, [currentEntryId, fetchEntry]);

  const updateEntryInCache = useCallback(
    (id: string, updates: Partial<JournalEntry>) => {
      setEntries((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;
        const next = new Map(prev);
        next.set(id, { ...existing, ...updates });
        return next;
      });
    },
    []
  );

  const removeEntryFromCache = useCallback((id: string) => {
    setEntries((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setCurrentEntryId((curr) => (curr === id ? null : curr));
  }, []);

  // Handle deep links - sync URL to state on mount and URL changes
  useEffect(() => {
    const match = pathname.match(/^\/app\/entry\/([^/]+)$/);
    if (match) {
      const urlEntryId = match[1];
      if (urlEntryId !== currentEntryId) {
        void switchEntry(urlEntryId);
      }
    } else if (pathname === "/app/journal" || pathname === "/app/entry") {
      setCurrentEntryId(null);
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on window focus for data freshness
  useEffect(() => {
    const onFocus = () => {
      void refreshEntry();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshEntry]);

  const value = useMemo<EntryContextValue>(
    () => ({
      currentEntry,
      isLoading,
      error,
      switchEntry,
      refreshEntry,
      updateEntryInCache,
      removeEntryFromCache,
    }),
    [
      currentEntry,
      isLoading,
      error,
      switchEntry,
      refreshEntry,
      updateEntryInCache,
      removeEntryFromCache,
    ]
  );

  return (
    <EntryContext.Provider value={value}>{children}</EntryContext.Provider>
  );
}

export function useEntry() {
  const context = useContext(EntryContext);
  if (!context) {
    throw new Error("useEntry must be used within an EntryProvider");
  }
  return context;
}

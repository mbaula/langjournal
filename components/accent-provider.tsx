"use client";

/** Syncs user accent choice to `<html data-accent="…">` and localStorage. See `lib/theme/accent.ts`. */

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {
  ACCENT_STORAGE_KEY,
  type AccentId,
  readStoredAccent,
} from "@/lib/theme/accent";

type AccentContextValue = {
  accent: AccentId;
  setAccent: (accent: AccentId) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

/** Drives `html[data-accent]` rules in globals.css (no inline styles). */
function applyAccent(accent: AccentId) {
  document.documentElement.dataset.accent = accent;
}

export function AccentProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [accent, setAccentState] = useState<AccentId>(() => readStoredAccent());

  useLayoutEffect(() => {
    applyAccent(accent);
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, accent);
    } catch {
      /* ignore */
    }
  }, [accent]);

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next);
  }, []);

  const value = useMemo<AccentContextValue>(
    () => ({ accent, setAccent }),
    [accent, setAccent],
  );

  return (
    <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
  );
}

export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) {
    return {
      accent: "neutral",
      setAccent: () => {},
    };
  }
  return ctx;
}

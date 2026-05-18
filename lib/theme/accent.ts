/**
 * Customize-menu accent IDs and metadata.
 *
 * **Where colors actually live:** CSS variables in `app/globals.css` under
 * `html[data-accent="<id>"]` and `html.dark[data-accent="<id>"]`.
 * This file does NOT define theme tokens—only ids, labels, and picker swatches.
 *
 * **Runtime:** `AccentProvider` sets `document.documentElement.dataset.accent`.
 * Root layout boot script applies the same attribute before paint (see `app/layout.tsx`).
 *
 * **Adding an accent:** (1) add id to `AccentId` + `ACCENT_OPTIONS`, (2) add matching
 * light/dark blocks in `globals.css`, (3) keep `ACCENT_IDS` in sync (used by boot script).
 *
 * **Note:** id `sand` is the yellow palette (label "Yellow"); anchor hex #FBE29D in globals.css.
 */
export const ACCENT_STORAGE_KEY = "accent";

export type AccentId =
  | "neutral"
  | "sage"
  | "slate"
  | "sand"
  | "rose"
  | "mist"
  | "purple"
  | "red"
  | "brown";

export type AccentOption = {
  id: AccentId;
  label: string;
  /** Picker preview only; approximate—tokens are in globals.css */
  swatch: string;
};

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "neutral", label: "Default", swatch: "oklch(0.45 0 0)" },
  { id: "sage", label: "Sage", swatch: "oklch(0.72 0.07 155)" },
  { id: "slate", label: "Slate", swatch: "oklch(0.68 0.06 250)" },
  { id: "sand", label: "Yellow", swatch: "#FBE29D" },
  { id: "rose", label: "Rose", swatch: "oklch(0.74 0.07 15)" },
  { id: "mist", label: "Mist", swatch: "oklch(0.74 0.06 210)" },
  { id: "purple", label: "Purple", swatch: "#AB92BF" },
  { id: "red", label: "Red", swatch: "oklch(0.6 0.18 27)" },
  { id: "brown", label: "Brown", swatch: "oklch(0.55 0.1 55)" },
];

export const ACCENT_IDS = ACCENT_OPTIONS.map((o) => o.id);

const ACCENT_IDS_SET = new Set(ACCENT_IDS);

export function isAccentId(value: string | null): value is AccentId {
  return value !== null && ACCENT_IDS_SET.has(value as AccentId);
}

export function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return "neutral";
  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (isAccentId(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "neutral";
}

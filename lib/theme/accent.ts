/**
 * Customize-menu accent IDs and picker swatches.
 *
 * **Id = name:** `AccentId` is used for `html[data-accent]`, localStorage, and UI labels
 * (capitalized via `accentLabel`). Color tokens live in `app/globals.css`.
 *
 * **Adding an accent:** add to `AccentId` + `ACCENT_OPTIONS`, add a light palette block in
 * `globals.css`, and extend `LEGACY_ACCENT_IDS` if renaming an existing id.
 */
export const ACCENT_STORAGE_KEY = "accent";

export type AccentId =
  | "gray"
  | "green"
  | "blue"
  | "yellow"
  | "pink"
  | "sky"
  | "purple"
  | "red"
  | "orange"
  | "teal";

export type AccentOption = {
  id: AccentId;
  /** Picker chip only—fixed preview hues; tune shell/chrome in globals.css, not swatches */
  swatch: string;
};

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "gray", swatch: "#5c5c5c" },
  { id: "green", swatch: "#789072" },
  { id: "blue", swatch: "#9FCEE4" },
  { id: "yellow", swatch: "#FFE790" },
  { id: "pink", swatch: "#b87a90" },
  { id: "sky", swatch: "#5a8fa3" },
  { id: "purple", swatch: "#C6C3F2" },
  { id: "red", swatch: "#F7BDB2" },
  { id: "orange", swatch: "#c48642" },
  { id: "teal", swatch: "#4f8484" },
];

export const ACCENT_IDS = ACCENT_OPTIONS.map((o) => o.id);

const ACCENT_IDS_SET = new Set<AccentId>(ACCENT_IDS);

/** Previous ids stored in localStorage before renames. */
export const LEGACY_ACCENT_IDS: Record<string, AccentId> = {
  neutral: "gray",
  sage: "green",
  slate: "blue",
  sand: "yellow",
  rose: "pink",
  mist: "sky",
  brown: "orange",
};

export function accentLabel(id: AccentId): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

export function isAccentId(value: string | null): value is AccentId {
  return value !== null && ACCENT_IDS_SET.has(value as AccentId);
}

export function normalizeAccentId(raw: string | null): AccentId {
  if (!raw) return "gray";
  if (raw in LEGACY_ACCENT_IDS) return LEGACY_ACCENT_IDS[raw]!;
  if (isAccentId(raw)) return raw;
  return "gray";
}

export function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return "gray";
  try {
    return normalizeAccentId(localStorage.getItem(ACCENT_STORAGE_KEY));
  } catch {
    return "gray";
  }
}

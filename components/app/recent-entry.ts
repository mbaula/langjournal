export type RecentEntry = {
  id: string;
  title: string | null;
  entryDate: string;
  /** Shown when `title` is null: truncated body preview (computed on the server). */
  bodyPreview: string;
};

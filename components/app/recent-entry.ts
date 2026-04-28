export type RecentEntry = {
  id: string;
  title: string | null;
  /** Shown when `title` is null: truncated body preview (computed on the server). */
  bodyPreview: string;
};

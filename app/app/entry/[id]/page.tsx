import { EntryViewer } from "@/components/journal/entry-viewer";
import { type TranslateTrigger } from "@/components/journal/journal-editor";
import { requireUser } from "@/lib/auth/session";
import { getLanguagePair } from "@/lib/db/language";

// A/B test flag: "enter" (default) or "tab"
// Set via NEXT_PUBLIC_TRANSLATE_TRIGGER env var
const translateTrigger: TranslateTrigger =
  (process.env.NEXT_PUBLIC_TRANSLATE_TRIGGER as TranslateTrigger) || "enter";

export default async function EntryPage() {
  const user = await requireUser();
  const { source, target } = await getLanguagePair(user.id);

  return (
    <EntryViewer
      sourceLanguage={source}
      targetLanguage={target}
      translateTrigger={translateTrigger}
    />
  );
}

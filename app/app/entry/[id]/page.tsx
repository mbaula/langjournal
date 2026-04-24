import { EntryViewer } from "@/components/journal/entry-viewer";
import { requireUser } from "@/lib/auth/session";
import { getLanguagePair } from "@/lib/db/language";

export default async function EntryPage() {
  const user = await requireUser();
  const { source, target } = await getLanguagePair(user.id);

  return <EntryViewer sourceLanguage={source} targetLanguage={target} />;
}

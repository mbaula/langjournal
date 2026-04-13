import { notFound } from "next/navigation";

import { LanguageProfileForm } from "@/components/settings/language-profile-form";
import { requireUser } from "@/lib/auth/session";
import { getLanguageProfile } from "@/lib/db/language";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getLanguageProfile(user.id);
  if (!profile) {
    notFound();
  }

  return (
    <LanguageProfileForm
      initialNative={profile.nativeLanguage}
      initialTarget={profile.targetLanguage}
    />
  );
}

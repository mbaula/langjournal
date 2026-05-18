import { notFound } from "next/navigation";

import { LanguageProfileForm } from "@/components/settings/language-profile-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";
import { getLanguageProfile } from "@/lib/db/language";

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, onboarding] = await Promise.all([
    getLanguageProfile(user.id),
    getOnboardingState(user.id),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-10 pt-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your profile and journal language preferences.
        </p>
      </header>

      <ProfileSettingsForm initialState={onboarding} />

      <LanguageProfileForm
        initialNative={profile.nativeLanguage}
        initialTarget={profile.targetLanguage}
      />
    </div>
  );
}

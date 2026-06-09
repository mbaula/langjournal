import { notFound } from "next/navigation";

import { LanguageProfileForm } from "@/components/settings/language-profile-form";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { isAccountPreviewMode, requireUser } from "@/lib/auth/session";
import {
  getDevPreviewLanguageProfile,
  getDevPreviewOnboardingState,
} from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";
import { getLanguageProfile } from "@/lib/db/language";

export default async function SettingsPage() {
  const preview = await isAccountPreviewMode();

  if (preview) {
    const profile = getDevPreviewLanguageProfile();
    const onboarding = getDevPreviewOnboardingState();

    return (
      <div className="flex w-full flex-col gap-8 pt-2 lg:gap-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.875rem]">
            Settings
          </h1>
          <p className="text-[13px] text-muted-foreground">
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

  const user = await requireUser();
  const [profile, onboarding] = await Promise.all([
    getLanguageProfile(user.id),
    getOnboardingState(user.id),
  ]);

  if (!profile) {
    notFound();
  }

  return (
    <div className="flex w-full flex-col gap-8 pt-2 lg:gap-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-[1.875rem]">
          Settings
        </h1>
        <p className="text-[13px] text-muted-foreground">
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

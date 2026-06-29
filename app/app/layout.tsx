import { redirect } from "next/navigation";

import { AppLayoutClient } from "@/components/app/app-layout-client";
import { AppTopNavClient } from "@/components/app/app-top-nav-client";
import { AuthSessionSync } from "@/components/auth/auth-session-sync";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import { getDevPreviewOnboardingState } from "@/lib/dev/preview-account";
import { getOnboardingState } from "@/lib/db/onboarding";
import { profileAvatarLetter } from "@/lib/user/profile-avatar-letter";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preview = await isAccountPreviewMode();
  const user = await requireAppSession();

  let userLabel: string;
  if (preview) {
    const onboarding = getDevPreviewOnboardingState();
    userLabel = onboarding.displayName?.trim() || "Alex (preview)";
  } else {
    const onboarding = await getOnboardingState(user.id);
    if (!onboarding.isComplete) {
      redirect("/onboarding");
    }
    userLabel =
      onboarding.displayName?.trim() || user.email.trim() || "Account";
  }

  return (
    <>
      <AuthSessionSync />
      <AppLayoutClient
      accountPreview={preview}
      topNav={
        <AppTopNavClient
          userLabel={userLabel}
          avatarLetter={profileAvatarLetter(userLabel)}
          previewMode={preview}
        />
      }
    >
      {children}
    </AppLayoutClient>
    </>
  );
}

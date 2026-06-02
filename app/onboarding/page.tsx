import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";
import { isDevPreviewParam } from "@/lib/dev/preview";

type OnboardingPageProps = {
  searchParams: Promise<{ preview?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { preview } = await searchParams;
  const previewOnboarding = isDevPreviewParam(preview, "onboarding");

  const user = await requireUser("/onboarding");
  const onboarding = await getOnboardingState(user.id);

  if (onboarding.isComplete && !previewOnboarding) {
    redirect("/app/journal");
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <OnboardingFlow
        initialState={onboarding}
        previewMode={previewOnboarding}
      />
    </div>
  );
}

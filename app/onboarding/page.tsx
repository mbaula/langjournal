import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";
import { isDevPreviewParam } from "@/lib/dev/preview";

type OnboardingPageProps = {
  searchParams: Promise<{ preview?: string }>;
};

const emptyOnboardingState = {
  displayName: null,
  ageRange: null,
  languages: [],
  isComplete: false,
} as const;

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { preview } = await searchParams;
  const previewOnboarding = isDevPreviewParam(preview, "onboarding");

  if (previewOnboarding) {
    return (
      <div
        data-force-light-scope
        data-marketing-theme="blue"
        className="min-h-dvh bg-background text-foreground transition-colors"
      >
        <OnboardingFlow initialState={emptyOnboardingState} />
      </div>
    );
  }

  const user = await requireUser("/onboarding");
  const onboarding = await getOnboardingState(user.id);

  if (onboarding.isComplete && !previewOnboarding) {
    redirect("/app/journal");
  }

  return (
    <div
      data-force-light-scope
      data-marketing-theme="blue"
      className="min-h-dvh bg-background text-foreground transition-colors"
    >
      <OnboardingFlow initialState={onboarding} />
    </div>
  );
}

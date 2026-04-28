import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const onboarding = await getOnboardingState(user.id);

  if (onboarding.isComplete) {
    redirect("/app/journal");
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <OnboardingFlow initialState={onboarding} />
    </div>
  );
}

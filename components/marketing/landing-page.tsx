import { LandingFaq } from "@/components/marketing/landing-faq";
import { LandingFeaturesDetail } from "@/components/marketing/landing-features-detail";
import { LandingFeaturesOverview } from "@/components/marketing/landing-features-overview";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { LandingJoinCta } from "@/components/marketing/landing-join-cta";
import { LandingLanguagesShowcase } from "@/components/marketing/landing-languages-showcase";
import { LandingProblemSolution } from "@/components/marketing/landing-problem-solution";
import { landingPageStackClassName } from "@/components/marketing/landing-spacing";
import { LandingUsers } from "@/components/marketing/landing-users";

export function LandingPage() {
  return (
    <>
      <div className={landingPageStackClassName}>
        <LandingFeaturesOverview />
        <LandingLanguagesShowcase />
        <LandingFeaturesDetail />
        <LandingProblemSolution />
        <LandingUsers />
        <LandingJoinCta />
        <LandingFaq />
      </div>
      <LandingFooter />
    </>
  );
}

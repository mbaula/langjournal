import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingPage } from "@/components/marketing/landing-page";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function MarketingHomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <LandingHero />
        <LandingPage />
      </main>
    </>
  );
}

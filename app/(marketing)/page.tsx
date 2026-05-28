import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingSections } from "@/components/marketing/landing-sections";
import { MarketingNav } from "@/components/marketing/marketing-nav";

export default function MarketingHomePage() {
  return (
    <>
      <MarketingNav />
      <main>
        <LandingHero />
        <LandingSections />
      </main>
      <footer className="border-t border-border/60 bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Folio</p>
          <p>Practice any language, one entry at a time.</p>
        </div>
      </footer>
    </>
  );
}

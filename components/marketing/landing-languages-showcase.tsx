import { getTranslations } from "next-intl/server";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { GOOGLE_TRANSLATE_LANGUAGE_FLAGS } from "@/lib/marketing/google-translate-language-flags";
import { cn } from "@/lib/utils";

function LanguageFlagMarquee() {
  const flags = [
    ...GOOGLE_TRANSLATE_LANGUAGE_FLAGS,
    ...GOOGLE_TRANSLATE_LANGUAGE_FLAGS,
  ];

  return (
    <div
      className="landing-language-marquee-mask mt-5 overflow-hidden sm:mt-6"
      aria-hidden
    >
      <div className="landing-language-marquee-track flex w-max gap-4 sm:gap-5">
        {flags.map((flag, index) => (
          <span
            key={`${flag}-${index}`}
            className="shrink-0 text-3xl leading-none sm:text-4xl"
          >
            {flag}
          </span>
        ))}
      </div>
    </div>
  );
}

export async function LandingLanguagesShowcase() {
  const t = await getTranslations("marketing.languagesShowcase");

  return (
    <section className="overflow-hidden bg-background">
      <div className={cn("mx-auto max-w-6xl", landingSectionXClassName)}>
        <LandingReveal className="text-center">
          <h2 className="font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
            {t("title")}
          </h2>
        </LandingReveal>
      </div>

      <LanguageFlagMarquee />
    </section>
  );
}

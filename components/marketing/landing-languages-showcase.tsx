import { getTranslations } from "next-intl/server";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import {
  flagImageUrl,
  SUPPORTED_LANGUAGE_FLAG_CODES,
} from "@/lib/marketing/language-flags";
import { cn } from "@/lib/utils";

function LanguageFlagMarquee() {
  const flags = [
    ...SUPPORTED_LANGUAGE_FLAG_CODES,
    ...SUPPORTED_LANGUAGE_FLAG_CODES,
  ];

  return (
    <div
      className="landing-language-marquee-mask mt-5 overflow-hidden sm:mt-6"
      aria-hidden
    >
      <div className="landing-language-marquee-track flex w-max items-center gap-4 sm:gap-5">
        {flags.map((code, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- decorative CDN SVGs; avoid next/image remote config for this marquee
          <img
            key={`${code}-${index}`}
            src={flagImageUrl(code)}
            alt=""
            width={40}
            height={30}
            className="h-7 w-auto shrink-0 rounded-[2px] shadow-sm sm:h-8"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
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

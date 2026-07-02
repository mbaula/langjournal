import { getTranslations } from "next-intl/server";

import { FeedbackInlineLink } from "@/components/feedback/feedback-button";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const faqItemIds = [
  "slashCommand",
  "privacy",
  "report",
  "beta",
  "cancel",
  "startLevel",
] as const;

export async function LandingFaq() {
  const t = await getTranslations("marketing.faq");

  return (
    <section id="faq" className="scroll-mt-16 bg-background">
      <div className={cn("mx-auto max-w-6xl", landingSectionXClassName)}>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 xl:gap-16">
          <LandingReveal className="lg:max-w-sm xl:max-w-md">
            <h2 className="font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              {t("title")}
            </h2>
          </LandingReveal>

          <LandingReveal delayMs={120} className="min-w-0 lg:col-start-2">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {faqItemIds.map((id) => (
                <details
                  key={id}
                  className="group rounded-2xl bg-[#2C2C2C]/[0.04] transition-colors open:bg-[#2C2C2C]/[0.06]"
                >
                  <summary className="cursor-pointer list-none px-4 py-4 text-[15px] font-medium text-foreground sm:px-5 sm:py-[1.125rem] [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center justify-between gap-4">
                      <span className="min-w-0 flex-1">
                        {t(`items.${id}.question`)}
                      </span>
                      <span
                        className="inline-flex size-8 shrink-0 items-center justify-center text-[1.625rem] font-light leading-none text-muted-foreground transition-transform group-open:rotate-45 sm:size-9 sm:text-[1.75rem]"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-left text-[14px] leading-relaxed text-muted-foreground sm:px-5 sm:pb-5">
                    {id === "report"
                      ? t.rich(`items.${id}.answer`, {
                          feedbackLink: (chunks) => (
                            <FeedbackInlineLink>{chunks}</FeedbackInlineLink>
                          ),
                        })
                      : t(`items.${id}.answer`)}
                  </div>
                </details>
              ))}
            </div>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}

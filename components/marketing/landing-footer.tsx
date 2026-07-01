import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { FolioWordmark } from "@/components/app/folio-wordmark";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const footerLinkClassName =
  "rounded-md text-[15px] font-medium text-[#262628]/70 transition-colors hover:text-[#262628] sm:text-base";

export async function LandingFooter() {
  const t = await getTranslations("marketing.footer");

  return (
    <footer className="w-full bg-[#D6DC82] text-[#262628]">
      <div
        className={cn(
          "mx-auto flex max-w-6xl flex-col gap-8 py-10 sm:py-12 lg:py-14",
          landingSectionXClassName,
        )}
      >
        <div className="flex flex-col gap-4">
          <FolioWordmark showBeta={false} />
          <p className="whitespace-nowrap font-[family-name:var(--font-folio)] text-[clamp(1.125rem,3.5vw,1.75rem)] font-semibold leading-none tracking-[-0.02em]">
            {t("tagline")}
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <nav
            className="flex flex-wrap items-center gap-x-6 gap-y-2"
            aria-label="Footer navigation"
          >
            <Link href="/#solution" className={footerLinkClassName}>
              {t("features")}
            </Link>
            <Link href="/#faq" className={footerLinkClassName}>
              {t("faq")}
            </Link>
            <FeedbackButton
              variant="marketing"
              className={footerLinkClassName}
            />
          </nav>

          <p className="text-[13px] text-[#262628]/65">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}

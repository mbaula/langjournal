import { getTranslations } from "next-intl/server";

import { LandingBulletList } from "@/components/marketing/landing-section";
import { landingColoredSectionYClassName, landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const problemKeys = ["0", "1", "2", "3"] as const;
const solutionKeys = ["0", "1", "2", "3"] as const;

export async function LandingProblemSolution() {
  const t = await getTranslations("marketing.problemSolution");

  const problemItems = problemKeys.map((key) => t(`problems.${key}`));
  const solutionItems = solutionKeys.map((key) => t(`solutions.${key}`));

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 w-full bg-[#9FCEE4] text-[#2C2C2C]"
    >
      <div
        className={cn(
          "mx-auto max-w-6xl",
          landingSectionXClassName,
          landingColoredSectionYClassName,
        )}
      >
        <div className="max-w-2xl">
          <h2 className="font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            {t("title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#2C2C2C]/85 sm:text-[17px]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#2C2C2C]/70">
              {t("problemLabel")}
            </p>
            <LandingBulletList
              items={problemItems}
              className="mt-4 [&_li]:text-[#2C2C2C]/85 [&_span:first-child]:bg-[#2C2C2C]/50"
            />
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#2C2C2C]/70">
              {t("solutionLabel")}
            </p>
            <LandingBulletList
              items={solutionItems}
              className="mt-4 [&_li]:text-[#2C2C2C]/85 [&_span:first-child]:bg-[#2C2C2C]/50"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

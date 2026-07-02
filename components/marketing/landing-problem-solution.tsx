import type { LucideIcon } from "lucide-react";
import { BookOpen, Flame, Gauge, Layers, LayoutGrid, LineChart, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  landingColoredSectionYClassName,
  landingSectionXClassName,
} from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const itemKeys = ["0", "1", "2", "3"] as const;

const problemIcons: LucideIcon[] = [LayoutGrid, BookOpen, Gauge, LineChart];

function problemSolutionIcon(Icon: LucideIcon, className?: string) {
  return (
    <Icon
      className={cn("size-[1.125rem] shrink-0", className)}
      strokeWidth={1.75}
    />
  );
}

type ProblemSolutionCardProps = {
  label: string;
  labelClassName: string;
  items: string[];
  getIcon: (index: number) => React.ReactNode;
};

function ProblemSolutionCard({
  label,
  labelClassName,
  items,
  getIcon,
}: ProblemSolutionCardProps) {
  return (
    <div className="rounded-2xl bg-white/55 px-6 py-7 shadow-sm backdrop-blur-[2px] sm:px-8 sm:py-8">
      <p
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.16em]",
          labelClassName,
        )}
      >
        {label}
      </p>
      <ul className="mt-5 space-y-5 sm:space-y-6">
        {items.map((item, index) => (
          <li
            key={item}
            className="flex items-start gap-3 text-[15px] leading-snug text-[#2C2C2C]/88 sm:text-base sm:leading-relaxed"
          >
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-[#2C2C2C]/70"
              aria-hidden
            >
              {getIcon(index)}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function LandingProblemSolution() {
  const t = await getTranslations("marketing.problemSolution");

  const problemItems = itemKeys.map((key) => t(`problems.${key}`));
  const solutionItems = itemKeys.map((key) => t(`solutions.${key}`));

  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 w-full bg-[#9FCEE4] text-[#2C2C2C]"
    >
      <div
        className={cn(
          "mx-auto max-w-5xl",
          landingSectionXClassName,
          landingColoredSectionYClassName,
        )}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            {t("title")}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#2C2C2C]/85 sm:mt-4 sm:text-[17px]">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          <ProblemSolutionCard
            label={t("problemLabel")}
            labelClassName="text-[#B56E3A]"
            items={problemItems}
            getIcon={(index) => problemSolutionIcon(problemIcons[index]!)}
          />
          <ProblemSolutionCard
            label={t("solutionLabel")}
            labelClassName="text-[#1F5C66]"
            items={solutionItems}
            getIcon={(index) => {
              if (index === 0) {
                return (
                  <span className="font-mono text-[15px] font-semibold leading-none text-[#1F5C66]">
                    //
                  </span>
                );
              }
              if (index === 1) {
                return problemSolutionIcon(Layers, "text-[#1F5C66]");
              }
              if (index === 2) {
                return problemSolutionIcon(Sparkles, "text-[#1F5C66]");
              }
              return problemSolutionIcon(Flame, "text-[#1F5C66]");
            }}
          />
        </div>
      </div>
    </section>
  );
}

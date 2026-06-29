import {
  Languages,
  Layers,
  LineChart,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingColoredSectionYClassName, landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const features: {
  id: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "write", label: "write", icon: NotebookPen },
  { id: "translate", label: "translate", icon: Languages },
  { id: "practice", label: "practice", icon: Layers },
  { id: "track", label: "track", icon: LineChart },
];

function FeatureGrid() {
  return (
    <div className="grid grid-cols-2 gap-[14px]">
      {features.map(({ id, label, icon: Icon }, index) => (
        <LandingReveal
          key={id}
          followScroll
          from="above"
          delayMs={index * 120}
        >
          <div className="flex h-full items-center justify-center gap-2 rounded-[18px] bg-background px-5 py-10 sm:px-6 sm:py-12">
            <Icon
              className="size-5 shrink-0 text-[#2C2C2C]/70 sm:size-[1.375rem]"
              strokeWidth={1.5}
            />
            <span className="font-sans text-base font-medium lowercase text-[#2C2C2C] sm:text-lg">
              {label}
            </span>
          </div>
        </LandingReveal>
      ))}
    </div>
  );
}

export function LandingFeaturesOverview() {
  return (
    <section
      id="solution"
      className="scroll-mt-16 bg-[#D6DC82] text-[#262628]"
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16",
          landingSectionXClassName,
          landingColoredSectionYClassName,
        )}
      >
        <LandingReveal>
          <h2 className="max-w-md font-[family-name:var(--font-folio)] text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
            Learn language writing hassle free
          </h2>
          <p className="mt-6 max-w-md font-sans text-base leading-relaxed sm:text-[17px]">
            Stop opening a{" "}
            <span className="underline decoration-[#262628]/50 decoration-1 underline-offset-[3px]">
              thousand different websites
            </span>{" "}
            just to write one sentence. Folio is the app to replace all apps.
          </p>
        </LandingReveal>

        <FeatureGrid />
      </div>
    </section>
  );
}

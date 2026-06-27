import {
  BookMarked,
  BookOpen,
  Globe,
  GraduationCap,
  Heart,
  Languages,
  MessageSquare,
  NotebookPen,
  Plane,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { LandingBulletList, LandingSection } from "./landing-section";
import { LandingReveal } from "./landing-reveal";
import { SlashTranslateDemo } from "./slash-translate-demo";

const chaosApps: {
  name: string;
  icon: LucideIcon;
  className: string;
}[] = [
  {
    name: "Google Translate",
    icon: Languages,
    className:
      "left-[4%] top-[8%] rotate-[-6deg] border-blue-200/80 bg-blue-50/90",
  },
  {
    name: "Duolingo",
    icon: GraduationCap,
    className:
      "right-[6%] top-[14%] rotate-[5deg] border-lime-200/80 bg-lime-50/90",
  },
  {
    name: "Conjugation site",
    icon: BookOpen,
    className:
      "left-[18%] bottom-[12%] rotate-[3deg] border-violet-200/80 bg-violet-50/90",
  },
  {
    name: "Dictionary",
    icon: BookMarked,
    className:
      "right-[20%] bottom-[18%] rotate-[-4deg] border-amber-200/80 bg-amber-50/90",
  },
  {
    name: "Reddit",
    icon: MessageSquare,
    className:
      "left-[42%] top-[38%] rotate-[-2deg] border-orange-200/80 bg-orange-50/90",
  },
];

const problemItems = [
  "You spend more time switching apps than actually writing",
  "You memorize random vocab lists you never end up using",
  "You lose momentum every single time you hit a word you don't know",
  'Traditional apps teach you "the cat is on the table" and nothing about how to talk about your actual life',
];

const solutionItems = [
  "Type // anywhere to instantly translate a word or phrase",
  "Learn words in context from your real life, not a textbook",
  "Come back to your entries and watch your progress over time",
];

const audienceCards: {
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Travelers",
    description:
      "You're learning before a trip, a move abroad, or a new job in another language.",
    icon: Plane,
  },
  {
    title: "App alumni",
    description:
      "You've tried all the language apps out there but you still get stuck when it's time to write.",
    icon: GraduationCap,
  },
  {
    title: "Journalers",
    description: "You already write every day and want that habit to build real fluency.",
    icon: NotebookPen,
  },
  {
    title: "Expats & heritage speakers",
    description:
      "You're living abroad or reconnecting with a language that's part of your story.",
    icon: Globe,
  },
  {
    title: "Partners & family",
    description:
      "You're learning to talk with someone you love — in their language or yours.",
    icon: Heart,
  },
];

const faqItems = [
  {
    question: "What languages does Folio support?",
    answer:
      "We support all major languages including French, Spanish, German, Japanese, Korean, Mandarin, Italian and more. If you don't see yours, let us know.",
  },
  {
    question: "Do I need to know the language to start?",
    answer:
      "Not at all. Complete beginners are welcome. You can write entirely in English and translate as much or as little as you want.",
  },
  {
    question: "What's the // command?",
    answer:
      "It's how you translate inside your journal. Type // followed by what you want to say, and Folio translates it inline so you never have to leave the page.",
  },
  {
    question: "Is my journal private?",
    answer:
      "Yes. Your entries are private by default and only visible to you.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No commitments on the monthly plan. Cancel whenever you want.",
  },
];

function ChaosAppsVisual() {
  return (
    <LandingReveal>
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-background p-4 sm:p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,color-mix(in_oklab,var(--sidebar-primary)_12%,transparent),transparent_70%)]"
          aria-hidden
        />
        <div className="relative grid grid-cols-2 gap-3 sm:hidden">
          {chaosApps.map(({ name, icon: Icon, className }) => (
            <div
              key={name}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur-sm",
                className,
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80 text-foreground/80">
                <Icon className="size-4" strokeWidth={1.5} />
              </span>
              <span className="text-[11px] font-medium leading-tight text-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
        <div className="relative hidden aspect-[4/3] sm:block">
          {chaosApps.map(({ name, icon: Icon, className }) => (
            <div
              key={name}
              className={cn(
                "absolute flex min-w-[10.5rem] items-center gap-2.5 rounded-xl border px-3.5 py-3 shadow-sm backdrop-blur-sm",
                className,
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80 text-foreground/80">
                <Icon className="size-4" strokeWidth={1.5} />
              </span>
              <span className="text-[13px] font-medium leading-tight text-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}

function ProblemVisual() {
  const cards = [
    { label: "Switch apps", icon: RefreshCw, rotate: "-rotate-3" },
    { label: "Random vocab", icon: BookOpen, rotate: "rotate-2" },
    { label: "Lost momentum", icon: MessageSquare, rotate: "-rotate-1" },
    { label: "Textbook phrases", icon: GraduationCap, rotate: "rotate-3" },
  ];

  return (
    <LandingReveal>
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-border/80 bg-background p-6 sm:max-w-none">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_30%_20%,color-mix(in_oklab,var(--sidebar-primary)_8%,transparent),transparent_65%)]"
          aria-hidden
        />
        <div className="relative space-y-3">
          {cards.map(({ label, icon: Icon, rotate }, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border/80 bg-background px-4 py-3 shadow-sm",
                rotate,
                index % 2 === 0 ? "ml-0 mr-6" : "ml-6 mr-0",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Icon className="size-4" strokeWidth={1.5} />
              </span>
              <span className="text-[13px] font-medium text-foreground/90">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </LandingReveal>
  );
}

function AudienceCards() {
  return (
    <LandingReveal className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {audienceCards.map(({ title, description, icon: Icon }) => (
        <div
          key={title}
          className="flex flex-col rounded-2xl border border-border/80 bg-background p-5 shadow-sm"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary/10 text-sidebar-primary">
            <Icon className="size-[18px]" strokeWidth={1.5} />
          </span>
          <p className="mt-4 text-[15px] font-medium leading-snug text-foreground">
            {title}
          </p>
          <p className="mt-2 flex-1 text-[13px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      ))}
    </LandingReveal>
  );
}

export function LandingSections() {
  return (
    <>
      <LandingSection
        layout="split"
        visualSide="right"
        tone="brand"
        className="border-b-0"
        visual={<ChaosAppsVisual />}
        eyebrow="The app chaos"
        title="An app to replace all apps."
        description="Stop opening a thousand different websites just to write one sentence."
      />

      <LandingSection
        id="problem"
        tone="brand"
        layout="split"
        visualSide="left"
        visual={<ProblemVisual />}
        eyebrow="The problem"
        title="Sound familiar?"
      >
        <LandingReveal>
          <LandingBulletList
            items={problemItems}
            tone="brand"
            className="mt-8 lg:mt-10"
          />
        </LandingReveal>
      </LandingSection>

      <LandingSection
        id="solution"
        accent="bar-left"
        layout="split"
        visualSide="right"
        visual={
          <LandingReveal>
            <SlashTranslateDemo />
          </LandingReveal>
        }
        eyebrow="The solution"
        title="Folio keeps you in the flow."
        description={
          <>
            Write freely in your language, drop a{" "}
            <span className="font-mono font-medium text-foreground">//</span>{" "}
            whenever you need a word or phrase, and keep going. Your thoughts
            stay intact. The language comes naturally.
          </>
        }
      >
        <LandingReveal>
          <LandingBulletList items={solutionItems} className="mt-8 lg:mt-10" />
        </LandingReveal>
      </LandingSection>

      <LandingSection id="who" tone="brand" align="center" title="Who it's for">
        <AudienceCards />
      </LandingSection>

      <LandingSection id="faq" align="center" title="FAQ">
        <LandingReveal className="landing-accent-bar-left mx-auto mt-10 max-w-2xl divide-y divide-border/60 pl-5 sm:pl-6">
          {faqItems.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer list-none text-[15px] font-medium text-foreground [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-4">
                  {item.question}
                  <span className="mt-0.5 shrink-0 text-muted-foreground transition-colors transition-transform group-open:rotate-45 group-open:text-sidebar-primary">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-left text-[14px] leading-relaxed text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </LandingReveal>
      </LandingSection>
    </>
  );
}

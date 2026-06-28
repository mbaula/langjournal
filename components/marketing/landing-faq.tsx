import type { ReactNode } from "react";

import { FeedbackInlineLink } from "@/components/feedback/feedback-button";
import { LandingReveal } from "@/components/marketing/landing-reveal";
import { landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

type FaqItem = {
  question: string;
  answer: ReactNode;
};

const faqItems: FaqItem[] = [
  {
    question: "What's the // command?",
    answer:
      "Type // anywhere in your journal and write in your own words — Folio translates it inline, right where you're writing. No tab-switching, no breaking your flow.",
  },
  {
    question: "Is my journal private?",
    answer:
      "Absolutely. Your entries are yours alone. We don't share your writing with anyone, and nothing is used to train AI models.",
  },
  {
    question: "How do I report a problem on Folio?",
    answer: (
      <>
        We&apos;re here to help! Tap <FeedbackInlineLink />  or the Feedback
        button anytime — whether you&apos;ve hit a bug, have a feature idea, or
        just need a hand.
      </>
    ),
  },
  {
    question: "What's a beta version?",
    answer:
      "Folio is in early access, which means we're still actively building and improving things. It's completely free right now, and you might run into the occasional bug — if you do, tell us and we'll get on it.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, no strings attached. You can cancel your subscription whenever you like, or delete your account entirely from Settings.",
  },
  {
    question: "Do I need to know the language to start?",
    answer:
      "Not at all — you're welcome to start from scratch. That said, Folio is best if you already know a few basics and want to practice putting sentences together.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="scroll-mt-16 bg-background">
      <div className={cn("mx-auto max-w-6xl", landingSectionXClassName)}>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 xl:gap-16">
          <LandingReveal className="lg:max-w-sm xl:max-w-md">
            <h2 className="font-[family-name:var(--font-folio)] text-[clamp(1.875rem,4.5vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground">
              Join a community of language learners
            </h2>
          </LandingReveal>

          <LandingReveal delayMs={120} className="min-w-0 lg:col-start-2">
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl bg-[#2C2C2C]/[0.04] transition-colors open:bg-[#2C2C2C]/[0.06]"
                >
                  <summary className="cursor-pointer list-none px-4 py-4 text-[15px] font-medium text-foreground sm:px-5 sm:py-[1.125rem] [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-4">
                      <span className="min-w-0 flex-1">{item.question}</span>
                      <span
                        className="inline-flex size-8 shrink-0 items-center justify-center text-[1.625rem] font-light leading-none text-muted-foreground transition-transform group-open:rotate-45 sm:size-9 sm:text-[1.75rem]"
                        aria-hidden
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-left text-[14px] leading-relaxed text-muted-foreground sm:px-5 sm:pb-5">
                    {item.answer}
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

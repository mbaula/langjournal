import { LandingBulletList } from "@/components/marketing/landing-section";
import { landingColoredSectionYClassName, landingSectionXClassName } from "@/components/marketing/landing-spacing";
import { cn } from "@/lib/utils";

const problemItems = [
  "More time switching apps than writing",
  "Vocab lists you never actually use",
  "Momentum lost every time you're stuck on a word",
  "Textbook phrases — not how you really talk",
];

const solutionItems = [
  "Translate mid-sentence using // command",
  "Learn words in context from your life",
  "Track your streak, words, and progress",
  "Save words to flashcards for practice",
];

export function LandingProblemSolution() {
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
            Folio keeps you in the flow.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#2C2C2C]/85 sm:text-[17px]">
            Here&apos;s how we&apos;re solving the problem.
          </p>
        </div>

        <div className="mt-10 grid gap-10 sm:mt-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#2C2C2C]/70">
              The problem
            </p>
            <LandingBulletList
              items={problemItems}
              className="mt-4 [&_li]:text-[#2C2C2C]/85 [&_span:first-child]:bg-[#2C2C2C]/50"
            />
          </div>

          <div>
            <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-[#2C2C2C]/70">
              The solution
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

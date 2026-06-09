import { marketingFlowEyebrowClassName } from "@/components/marketing/marketing-flow-styles";
import { cn } from "@/lib/utils";

export const ONBOARDING_QUESTION_COUNT = 3;

type OnboardingProgressProps = {
  step: number;
  total?: number;
  className?: string;
};

export function OnboardingProgress({
  step,
  total = ONBOARDING_QUESTION_COUNT,
  className,
}: OnboardingProgressProps) {
  return (
    <div className={cn("mb-8", className)}>
      <p className={marketingFlowEyebrowClassName}>
        Question {step} of {total}
      </p>
      <div
        className="mt-3 flex gap-2"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`Question ${step} of ${total}`}
      >
        {Array.from({ length: total }, (_, index) => {
          const questionNumber = index + 1;
          const isComplete = questionNumber < step;
          const isCurrent = questionNumber === step;

          return (
            <div
              key={questionNumber}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                isComplete || isCurrent
                  ? "bg-sidebar-primary"
                  : "bg-muted/80",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

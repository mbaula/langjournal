import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { MarketingFlowShell } from "@/components/marketing/marketing-flow-shell";
import {
  marketingFlowDescriptionClassName,
  marketingFlowEyebrowClassName,
  marketingFlowTitleClassName,
} from "@/components/marketing/marketing-flow-styles";
import { resolveLoginErrorMessage } from "@/lib/auth/callback-errors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, redirectTo } = await searchParams;

  return (
    <MarketingFlowShell>
      <p
        className={cn(
          marketingFlowEyebrowClassName,
          "landing-enter landing-enter-delay-1 mb-0",
        )}
      >
        Sign in
      </p>
      <h1
        className={cn(
          marketingFlowTitleClassName,
          "landing-enter landing-enter-delay-2 mt-3 max-w-none text-[clamp(1.875rem,4.5vw,2.75rem)]",
        )}
      >
        Continue with email
      </h1>
      <p
        className={cn(
          marketingFlowDescriptionClassName,
          "landing-enter landing-enter-delay-3 text-[#2C2C2C]/60",
        )}
      >
        We&apos;ll email you a magic link — no password to remember.
      </p>
      <LoginForm
        redirectTo={redirectTo}
        error={error ? resolveLoginErrorMessage(error) : undefined}
        className="landing-enter landing-enter-delay-4"
      />
      <div className="landing-enter landing-enter-delay-5 mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-sans text-[15px] font-medium text-[#2C2C2C]/60 transition-colors hover:text-[#2C2C2C]"
        >
          Back to home
          <ArrowUpRight className="size-4" strokeWidth={1.5} />
        </Link>
      </div>
    </MarketingFlowShell>
  );
}

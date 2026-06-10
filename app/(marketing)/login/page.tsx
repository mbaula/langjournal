import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { MarketingFlowShell } from "@/components/marketing/marketing-flow-shell";
import {
  marketingFlowDescriptionClassName,
  marketingFlowEyebrowClassName,
  marketingFlowNavButtonClassName,
} from "@/components/marketing/marketing-flow-styles";
import { buttonVariants } from "@/components/ui/button";
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
    <div
      data-force-light-scope
      data-marketing-theme="blue"
      className="min-h-dvh bg-background text-foreground"
    >
      <MarketingFlowShell>
        <p className={marketingFlowEyebrowClassName}>Sign in</p>
        <h1 className="mt-2 font-[family-name:var(--font-folio)] text-[clamp(1.625rem,5vw,1.875rem)] font-semibold tracking-[-0.02em] text-foreground sm:mt-3">
          Continue with email
        </h1>
        <p className={marketingFlowDescriptionClassName}>
          We&apos;ll email you a magic link — no password to remember.
        </p>
        <LoginForm
          redirectTo={redirectTo}
          error={error ? resolveLoginErrorMessage(error) : undefined}
        />
        <div className="mt-6">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              marketingFlowNavButtonClassName,
              "inline-flex h-auto items-center gap-1 rounded-full px-0 hover:bg-transparent",
            )}
          >
            Back to home
            <ArrowUpRight className="size-4" strokeWidth={2} />
          </Link>
        </div>
      </MarketingFlowShell>
    </div>
  );
}

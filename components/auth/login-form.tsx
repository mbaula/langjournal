"use client";

import { useState } from "react";

import {
  marketingFlowCardClassName,
  marketingFlowFieldClassName,
  marketingHeroCtaClassName,
} from "@/components/marketing/marketing-flow-styles";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  redirectTo?: string;
  error?: string;
  className?: string;
};

export function LoginForm({
  redirectTo,
  error: initialError,
  className,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState(initialError ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const next = safeNextPath(redirectTo ?? null);
    const origin = window.location.origin;
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Check your email for a sign-in link.");
  }

  return (
    <div className={cn("mt-8", className)}>
      <form
        onSubmit={onSubmit}
        className={cn(marketingFlowCardClassName, "flex flex-col gap-4")}
      >
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading" || status === "sent"}
          aria-invalid={status === "error" || Boolean(initialError)}
          className={marketingFlowFieldClassName}
        />
        {message ? (
          <p
            className={
              status === "error" || initialError
                ? "text-[14px] text-destructive"
                : "text-[14px] text-muted-foreground"
            }
            role={status === "error" || initialError ? "alert" : undefined}
          >
            {message}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={status === "loading" || status === "sent"}
          className={cn(
            marketingHeroCtaClassName,
            "w-full",
            status === "sent" && "opacity-80",
          )}
        >
          {status === "loading" ? "Sending link…" : "Email me a magic link"}
        </Button>
      </form>
    </div>
  );
}

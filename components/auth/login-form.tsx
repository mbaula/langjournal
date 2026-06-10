"use client";

import { useState } from "react";

import { marketingFlowFieldClassName } from "@/components/marketing/marketing-flow-styles";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

type LoginFormProps = {
  redirectTo?: string;
  error?: string;
};

export function LoginForm({ redirectTo, error: initialError }: LoginFormProps) {
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
    <form
      onSubmit={onSubmit}
      className="mt-6 flex w-full min-w-0 flex-col gap-4 sm:mt-8"
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
          "h-12 w-full rounded-full px-6 text-[15px] shadow-sm",
          status === "sent" && "opacity-80",
        )}
      >
        {status === "loading" ? "Sending link…" : "Email me a magic link"}
      </Button>
    </form>
  );
}

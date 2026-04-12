"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/auth/redirect";

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
      className="flex w-full max-w-sm flex-col gap-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
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
        />
      </div>
      {message ? (
        <p
          className={
            status === "error" || initialError
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
          role={status === "error" || initialError ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={status === "loading" || status === "sent"}
        className="w-full"
      >
        {status === "loading" ? "Sending link…" : "Email me a magic link"}
      </Button>
    </form>
  );
}

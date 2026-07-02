"use client";

import { useRouter } from "next/navigation";
import { type ComponentProps, useState } from "react";

interface SignOutButtonProps extends ComponentProps<"button"> {
  previewMode?: boolean;
  onSignedOut?: () => void;
}

export function SignOutButton({
  previewMode,
  onSignedOut,
  children,
  disabled,
  ...props
}: SignOutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    if (pending) return;
    setPending(true);

    try {
      if (previewMode) {
        // Exit preview mode
        await fetch("/api/dev/exit-account-preview", { method: "POST" });
      } else {
        // Sign out via POST to avoid link prefetch issues
        await fetch("/auth/signout", { method: "POST" });
      }
      onSignedOut?.();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={disabled || pending}
      {...props}
    >
      {children}
    </button>
  );
}

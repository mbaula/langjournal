"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

const REFRESH_DEBOUNCE_MS = 250;
const SKIP_REFRESH_AFTER_MOUNT_MS = 1_500;

/** Keeps server-rendered auth state in sync after Supabase refreshes tokens client-side. */
export function AuthSessionSync() {
  const router = useRouter();
  const mountedAtRef = useRef(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") {
        return;
      }

      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "TOKEN_REFRESHED" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }

      if (Date.now() - mountedAtRef.current < SKIP_REFRESH_AFTER_MOUNT_MS) {
        return;
      }

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [router]);

  return null;
}

import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AppLayoutClient } from "@/components/app/app-layout-client";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppSidebarSkeleton } from "@/components/app/app-sidebar-skeleton";
import { isAccountPreviewMode, requireAppSession } from "@/lib/auth/session";
import { getOnboardingState } from "@/lib/db/onboarding";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const preview = await isAccountPreviewMode();
  const user = await requireAppSession();

  if (!preview) {
    const onboarding = await getOnboardingState(user.id);
    if (!onboarding.isComplete) {
      redirect("/onboarding");
    }
  }

  return (
    <AppLayoutClient
      accountPreview={preview}
      sidebar={
        <Suspense fallback={<AppSidebarSkeleton />}>
          <AppSidebar />
        </Suspense>
      }
    >
      {children}
    </AppLayoutClient>
  );
}

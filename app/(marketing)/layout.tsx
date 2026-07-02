import { LandingMotion } from "@/components/marketing/landing-motion";
import { ForceLightScope } from "@/components/theme/force-light-scope";

export const dynamic = "force-dynamic";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LandingMotion>
      <ForceLightScope
        data-marketing-theme="blue"
        className="flex min-h-dvh flex-col"
      >
        {children}
      </ForceLightScope>
    </LandingMotion>
  );
}

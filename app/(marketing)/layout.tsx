import { LandingMotion } from "@/components/marketing/landing-motion";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LandingMotion>
      <div
        data-marketing-theme="blue"
        className="flex min-h-dvh flex-col bg-background text-foreground"
      >
        {children}
      </div>
    </LandingMotion>
  );
}

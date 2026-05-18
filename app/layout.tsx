import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";

import { AccentProvider } from "@/components/accent-provider";
import { ACCENT_IDS } from "@/lib/theme/accent";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Language Journal",
    template: "%s · Language Journal",
  },
  description:
    "Journal in your language, translate with /translate, keep a single timeline.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col">
        {/* Theme + accent before hydration: .dark on <html>, data-accent from localStorage (ACCENT_IDS). */}
        <Script id="theme-boot" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=t==="dark"||((t===null||t==="system"||t==="")&&d);document.documentElement.classList.toggle("dark",dark);var a=localStorage.getItem("accent");var accents=${JSON.stringify(ACCENT_IDS)};document.documentElement.dataset.accent=accents.indexOf(a)>=0?a:"neutral";}catch(e){}})();`}
        </Script>
        <div className="app-grain" aria-hidden />
        <ThemeProvider>
          <AccentProvider>{children}</AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

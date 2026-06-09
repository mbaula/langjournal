import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";

import { AccentProvider } from "@/components/accent-provider";
import { ACCENT_IDS, LEGACY_ACCENT_IDS } from "@/lib/theme/accent";
import "./globals.css";

const accentBootScript = `(function(){try{document.documentElement.classList.remove("dark");localStorage.removeItem("theme");var a=localStorage.getItem("accent");var leg=${JSON.stringify(LEGACY_ACCENT_IDS)};if(a&&leg[a])a=leg[a];var accents=${JSON.stringify(ACCENT_IDS)};document.documentElement.dataset.accent=accents.indexOf(a)>=0?a:"gray";}catch(e){}})();`;

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const folioDisplay = Fraunces({
  variable: "--font-folio",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Folio",
    template: "%s · Folio",
  },
  description:
    "Practice any language for free. Write daily, translate inline, and build a journal habit with Folio.",
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
      className={`${inter.variable} ${geistMono.variable} ${folioDisplay.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: accentBootScript }} />
      </head>
      <body className="relative flex min-h-full flex-col">
        <div className="app-grain" aria-hidden />
        <AccentProvider>{children}</AccentProvider>
      </body>
    </html>
  );
}

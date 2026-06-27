import type { Metadata, Viewport } from "next";
import { Geist_Mono, IM_Fell_DW_Pica, Inclusive_Sans } from "next/font/google";

import { AccentProvider } from "@/components/accent-provider";
import { ThemeBootScript } from "@/components/theme-boot-script";
import { ThemeProvider } from "@/components/theme-provider";
import { ACCENT_IDS, LEGACY_ACCENT_IDS } from "@/lib/theme/accent";
import {
  FORCE_LIGHT_DATA_ATTR,
  LIGHT_ONLY_PATHS,
} from "@/lib/theme/light-only-paths";
import "./globals.css";

const themeBootScript = `(function(){try{var path=window.location.pathname;if(path.length>1&&path.charAt(path.length-1)==="/")path=path.slice(0,-1);var lightOnly=${JSON.stringify(LIGHT_ONLY_PATHS)};var forceLight=lightOnly.indexOf(path)>=0;var html=document.documentElement;if(forceLight){html.dataset.${FORCE_LIGHT_DATA_ATTR}="true";html.classList.remove("dark");}else{delete html.dataset.${FORCE_LIGHT_DATA_ATTR};}var t=localStorage.getItem("theme");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=!forceLight&&(t==="dark"||((t===null||t==="system"||t==="")&&d));if(!forceLight)html.classList.toggle("dark",dark);var a=localStorage.getItem("accent");var leg=${JSON.stringify(LEGACY_ACCENT_IDS)};if(a&&leg[a])a=leg[a];var accents=${JSON.stringify(ACCENT_IDS)};html.dataset.accent=accents.indexOf(a)>=0?a:"gray";}catch(e){}})();`;

const inclusiveSans = Inclusive_Sans({
  variable: "--font-inclusive-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const folioDisplay = IM_Fell_DW_Pica({
  variable: "--font-folio",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
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
      className={`${inclusiveSans.variable} ${inclusiveSans.className} ${geistMono.variable} ${folioDisplay.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-background text-foreground">
        <ThemeBootScript script={themeBootScript} />
        <div className="app-grain" aria-hidden />
        <ThemeProvider>
          <AccentProvider>{children}</AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

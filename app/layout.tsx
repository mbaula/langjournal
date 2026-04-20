import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";

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
        <div className="app-grain" aria-hidden />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

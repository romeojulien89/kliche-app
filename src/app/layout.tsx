import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeToggle } from "@/components/theme-toggle";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kliché",
  description:
    "Recevez vos photos d'événement instantanément, par reconnaissance faciale.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body
        className="relative flex min-h-full flex-col bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        <div
          className="pagne-pattern pointer-events-none fixed inset-0 -z-10"
          aria-hidden="true"
        />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}

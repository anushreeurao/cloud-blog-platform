import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ServiceWorkerCleanup } from "@/components/layout/service-worker-cleanup";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppToaster } from "@/components/layout/toaster";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Inkflow | Premium Blogging Platform",
    template: "%s | Inkflow",
  },
  description:
    "A modern Medium-like blogging platform built with Next.js, Supabase Auth, Postgres RLS, and Supabase Storage.",
  openGraph: {
    title: "Inkflow",
    description: "Modern publishing platform for writers and creators.",
    url: siteUrl,
    siteName: "Inkflow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkflow",
    description: "Modern publishing platform for writers and creators.",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen text-zinc-900 dark:text-zinc-50">
        <ThemeProvider>
          <ServiceWorkerCleanup />
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
          <SiteFooter />
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

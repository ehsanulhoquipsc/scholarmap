import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "ScholarMap", template: "%s · ScholarMap" },
  description: "Explore universities, academic programs and scholarships around the world.",
};

const THEME_SCRIPT = `try{var t=(JSON.parse(localStorage.getItem("scholarmap:v1")||"{}").theme)||"light";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint so dark mode never flashes light */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
        {/* Start downloading the map shapes immediately, in parallel with the JS */}
        <link rel="preload" href="/geo/countries-50m.json" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>
        {/* The prototype is driven by client state (localStorage, today's date), so the shell streams in. */}
        <Suspense fallback={null}>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}

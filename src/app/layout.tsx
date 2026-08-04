import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthToast } from "@/components/AuthToast";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PTI Event Board | Petroleum Training Institute",
  description:
    "Browse and create upcoming campus events at the Petroleum Training Institute, Effurun, Delta State, Nigeria.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-pti-green/10 bg-card px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
          <p className="mx-auto max-w-6xl">
            Petroleum Training Institute, Effurun &middot; Delta State, Nigeria
          </p>
        </footer>
        <Suspense fallback={null}>
          <AuthToast />
        </Suspense>
        <Toaster
          position="top-center"
          closeButton
          richColors
          expand
          offset={16}
          mobileOffset={10}
          duration={5000}
        />
      </body>
    </html>
  );
}

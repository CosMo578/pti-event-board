import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/Navbar";
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
    "Browse and post upcoming campus events at the Petroleum Training Institute, Effurun, Delta State, Nigeria.",
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
      <body className="flex min-h-full flex-col bg-pti-cream text-gray-900">
        <Navbar />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-pti-green/10 bg-white py-6 text-center text-sm text-gray-500">
          Petroleum Training Institute, Effurun &middot; Delta State, Nigeria
        </footer>
      </body>
    </html>
  );
}

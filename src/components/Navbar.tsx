"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/AuthButton";

export function Navbar() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      pathname === path
        ? "bg-pti-green text-white"
        : "text-pti-green hover:bg-pti-green/10"
    }`;

  return (
    <header className="border-b border-pti-green/20 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-bold text-pti-green sm:text-xl">
            PTI Event Board
          </span>
          <span className="text-xs text-gray-500 sm:text-sm">
            Petroleum Training Institute, Effurun
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          <Link href="/" className={linkClass("/")}>
            Events
          </Link>
          <Link href="/post" className={linkClass("/post")}>
            Post Event
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}

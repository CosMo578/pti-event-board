"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/post", label: "Post Event" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const linkClass = (path: string) =>
    cn(
      "h-9 px-3 text-sm font-medium",
      isActive(path)
        ? "bg-pti-green text-white hover:bg-pti-green-dark hover:text-white"
        : "text-pti-green hover:bg-pti-green/10 hover:text-pti-green",
    );

  const mobileLinkClass = (path: string) =>
    cn(
      "flex h-11 w-full items-center rounded-lg px-3 text-base font-medium transition-colors",
      isActive(path)
        ? "bg-pti-green text-white"
        : "text-pti-green hover:bg-pti-green/10",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-pti-green/20 bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="min-w-0 shrink">
          <span className="block truncate text-base font-bold text-pti-green sm:text-xl">
            PTI Event Board
          </span>
          <span className="hidden text-xs text-muted-foreground sm:block">
            Petroleum Training Institute, Effurun
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Button
                key={href}
                asChild
                variant="ghost"
                className={linkClass(href)}
              >
                <Link href={href}>{label}</Link>
              </Button>
            ))}
          </nav>

          <AuthButton />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-pti-green/25 text-pti-green md:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle className="text-pti-green">Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4 pb-4" aria-label="Primary">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={mobileLinkClass(href)}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AuthButton } from "@/components/AuthButton";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Events" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/create", label: "Create Event" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const linkClass = (path: string) =>
    cn(
      "h-9 px-3 text-sm font-medium",
      isActive(path)
        ? "bg-pti-green text-white hover:bg-pti-green-dark hover:text-white"
        : "text-pti-green hover:bg-pti-green/10 hover:text-pti-green",
    );

  const desktopLinks = NAV_LINKS.filter(
    ({ href }) => !(href === "/" && isHome),
  );

  const showNav = authReady && !!user;

  return (
    <header className="sticky top-0 z-40 border-b border-pti-green/20 bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6">
        <Link href="/" className="min-w-0 flex-1 pr-2">
          <span className="block truncate text-sm font-bold text-pti-green sm:text-xl">
            PTI Event Board
          </span>
          <span className="hidden truncate text-xs text-muted-foreground sm:block">
            Petroleum Training Institute, Effurun
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {showNav ? (
            <nav className="hidden items-center gap-1 md:flex">
              {desktopLinks.map(({ href, label }) => (
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
          ) : null}

          <AuthButton includeMobileNav={showNav} />
        </div>
      </div>
    </header>
  );
}

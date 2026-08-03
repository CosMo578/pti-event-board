"use client";

import { Bell, LogOut, LayoutDashboard, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getGoogleAvatarUrl, getGoogleDisplayName } from "@/lib/google-user";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { NotificationSettings } from "@/components/NotificationSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function AuthButton() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async () => {
    const next = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="size-9 animate-pulse rounded-full bg-muted" aria-hidden />
    );
  }

  if (user) {
    const avatarUrl = getGoogleAvatarUrl(user);
    const displayName = getGoogleDisplayName(user);
    const initials = displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="text-pti-green hover:bg-pti-green/10 hover:text-pti-green"
            onClick={() => setSettingsOpen(true)}
            title="Notification settings"
            aria-label="Notification settings"
          >
            <Bell className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full p-0"
                aria-label="Account menu"
              >
                <Avatar className="size-9 border border-pti-green/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-pti-green/15 text-pti-green">
                    {initials || <UserRound className="size-4" />}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{displayName}</p>
                {user.email && (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <NotificationSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </>
    );
  }

  return (
    <Button
      onClick={signIn}
      size="sm"
      className="bg-pti-gold px-2.5 text-pti-green hover:bg-pti-gold/90 sm:px-3"
    >
      <span className="sm:hidden">Sign in</span>
      <span className="hidden sm:inline">Sign in with Google</span>
    </Button>
  );
}

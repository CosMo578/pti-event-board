"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function AuthButton() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/post`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-500">
        ...
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[140px] truncate text-sm text-gray-600 sm:inline">
          {user.email}
        </span>
        <button
          onClick={signOut}
          className="rounded-lg border border-pti-green/30 px-3 py-2 text-sm font-medium text-pti-green transition-colors hover:bg-pti-green/10"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="rounded-lg bg-pti-gold px-3 py-2 text-sm font-medium text-pti-green transition-colors hover:bg-pti-gold/90"
    >
      Sign in with Google
    </button>
  );
}

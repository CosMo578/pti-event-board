import type { User } from "@supabase/supabase-js";

export function getGoogleDisplayName(user: User): string {
  const meta = user.user_metadata ?? {};
  const name =
    meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "PTI User";
  return String(name);
}

export function getGoogleAvatarUrl(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return url ? String(url) : null;
}

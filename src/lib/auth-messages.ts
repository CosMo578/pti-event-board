export type SignInReason =
  | "create"
  | "event"
  | "dashboard"
  | "edit"
  | "default";

const SIGN_IN_MESSAGES: Record<SignInReason, string> = {
  create: "Sign in to create events",
  event: "Sign in to view more details about the event",
  dashboard: "Sign in to view the dashboard",
  edit: "Sign in to edit events",
  default: "Sign in to continue",
};

export function getSignInMessage(reason: string | null | undefined): string {
  if (reason && reason in SIGN_IN_MESSAGES) {
    return SIGN_IN_MESSAGES[reason as SignInReason];
  }
  return SIGN_IN_MESSAGES.default;
}

/** Map a pathname to a contextual sign-in toast reason. */
export function getSignInReasonForPath(pathname: string): SignInReason {
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return "create";
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "dashboard";
  }
  if (/^\/events\/[^/]+\/edit/.test(pathname)) {
    return "edit";
  }
  if (pathname.startsWith("/events/")) {
    return "event";
  }
  return "default";
}

/** Paths that signed-out users may access without redirect. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/auth/")) return true;
  if (pathname.startsWith("/api/")) return true;
  return false;
}

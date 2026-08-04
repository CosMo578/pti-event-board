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

/** Paths that require sign-in; everything else is browseable publicly. */
export function isProtectedPath(pathname: string): boolean {
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return true;
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return true;
  }
  if (/^\/events\/[^/]+\/edit(?:\/|$)/.test(pathname)) {
    return true;
  }
  return false;
}

/** Map a pathname to a contextual sign-in toast reason. */
export function getSignInReasonForPath(pathname: string): SignInReason {
  if (pathname === "/create" || pathname.startsWith("/create/")) {
    return "create";
  }
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return "dashboard";
  }
  if (/^\/events\/[^/]+\/edit(?:\/|$)/.test(pathname)) {
    return "edit";
  }
  if (pathname.startsWith("/events/")) {
    return "event";
  }
  return "default";
}

/** Paths that signed-out users may access without redirect. */
export function isPublicPath(pathname: string): boolean {
  return !isProtectedPath(pathname);
}

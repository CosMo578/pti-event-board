"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getSignInMessage } from "@/lib/auth-messages";

/**
 * Shows a contextual sign-in toast when redirected from a protected route
 * (`?signin=<reason>`), then removes the query param from the URL.
 */
export function AuthToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const reason = searchParams.get("signin");
    const authError = searchParams.get("auth");

    if (!reason && authError !== "error") return;

    if (reason) {
      toast.info(getSignInMessage(reason), {
        id: `signin-${reason}`,
      });
    } else if (authError === "error") {
      toast.error("Sign-in failed. Please try again.", {
        id: "signin-error",
      });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("signin");
    params.delete("auth");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [searchParams, pathname, router]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/lib/push-notifications";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface Preferences {
  push_enabled: boolean;
}

const BLOCKED_PERMISSION_HELP =
  "Notifications are blocked for this site. Click the lock or info icon in your browser’s address bar, set Notifications to Allow, then turn this switch on again.";

async function ensureNotificationPermission(): Promise<"granted" | "denied" | "default" | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  // Always re-read current permission so a user who reset site settings
  // (denied → Ask) can be prompted again without reloading.
  let permission = Notification.permission;

  if (permission === "granted") {
    return "granted";
  }

  if (permission === "denied") {
    // Browsers will not show the prompt again while permission is denied.
    // Calling requestPermission() still returns "denied" immediately, but we
    // try once in case the engine refreshed state after settings changes.
    permission = await Notification.requestPermission();
    return permission;
  }

  // permission === "default" — show the browser prompt.
  permission = await Notification.requestPermission();
  return permission;
}

export function NotificationSettings({ open, onClose }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    fetch("/api/notifications/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setPrefs({ push_enabled: !!data.push_enabled });
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load settings.");
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleClose = () => {
    setPrefs(null);
    setError("");
    onClose();
  };

  const updatePush = async (value: boolean) => {
    if (!prefs) return;
    setSaving(true);
    setError("");

    try {
      if (value) {
        const permission = await ensureNotificationPermission();

        if (permission === "unsupported") {
          setError("Notifications are not supported in this browser.");
          setSaving(false);
          return;
        }

        if (permission !== "granted") {
          setError(
            permission === "denied"
              ? BLOCKED_PERMISSION_HELP
              : "Notification permission was not granted. Try again, or allow notifications when your browser asks.",
          );
          setSaving(false);
          return;
        }

        await registerPushSubscription();
      } else {
        await unregisterPushSubscription();
      }

      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ push_enabled: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }

      setPrefs({ push_enabled: !!data.push_enabled });
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const loading = open && !prefs && !error;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-pti-green">
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Enable browser push for a daily event digest and alerts when new
            public events are posted.
          </DialogDescription>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!loading && prefs && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="push-enabled" className="text-sm font-normal">
                Browser push notifications
              </Label>
              <Switch
                id="push-enabled"
                checked={prefs.push_enabled}
                disabled={saving}
                onCheckedChange={updatePush}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Requires HTTPS in production. You can change this anytime. If you
              previously blocked notifications, allow them in your browser site
              settings, then toggle this on again.
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { formatAttendingLabel } from "@/lib/event-query";

interface RsvpButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  hasRsvp: boolean;
  isFull?: boolean;
}

export function RsvpButton({
  eventId,
  isAuthenticated,
  hasRsvp: initialHasRsvp,
  isFull = false,
}: RsvpButtonProps) {
  const router = useRouter();
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Sign in with Google to RSVP for this event.
      </p>
    );
  }

  if (isFull && !hasRsvp) {
    return (
      <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        This event is full.
      </p>
    );
  }

  const toggleRsvp = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: hasRsvp ? "DELETE" : "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setHasRsvp(!hasRsvp);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0">
      <Button
        onClick={toggleRsvp}
        disabled={loading}
        size="lg"
        variant={hasRsvp ? "outline" : "default"}
        className={
          hasRsvp
            ? "h-11 w-full border-pti-green text-pti-green hover:bg-pti-green/10 sm:w-auto"
            : "h-11 w-full bg-pti-green text-white hover:bg-pti-green-dark sm:w-auto"
        }
      >
        {loading
          ? "Updating..."
          : hasRsvp
            ? "Cancel RSVP"
            : "RSVP — I'm attending"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}

const MAX_VISIBLE_ATTENDEES = 5;

interface AttendeeListProps {
  attendees: { display_name: string; avatar_url: string | null; user_id: string }[];
  isPast?: boolean;
  maxAttendees?: number | null;
}

export function AttendeeList({
  attendees,
  isPast = false,
  maxAttendees = null,
}: AttendeeListProps) {
  if (attendees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isPast ? (
          <>No one RSVP&apos;d to this event.</>
        ) : maxAttendees != null ? (
          <>No one has RSVP&apos;d yet (0 / {maxAttendees}). Be the first!</>
        ) : (
          <>No one has RSVP&apos;d yet. Be the first!</>
        )}
      </p>
    );
  }

  const visible = attendees.slice(0, MAX_VISIBLE_ATTENDEES);
  const overflow = attendees.length - visible.length;

  return (
    <div className="min-w-0 space-y-3">
      <p className="text-sm font-medium text-foreground">
        {formatAttendingLabel(attendees.length, maxAttendees)}
      </p>
      <AvatarGroup>
        {visible.map((attendee) => (
          <Avatar key={attendee.user_id} size="lg">
            {attendee.avatar_url ? (
              <AvatarImage
                src={attendee.avatar_url}
                alt=""
              />
            ) : null}
            <AvatarFallback className="bg-pti-green/20 text-pti-green">
              {attendee.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {overflow > 0 ? (
          <AvatarGroupCount>+{overflow}</AvatarGroupCount>
        ) : null}
      </AvatarGroup>
    </div>
  );
}

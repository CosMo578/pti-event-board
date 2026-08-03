"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RsvpButtonProps {
  eventId: string;
  isAuthenticated: boolean;
  hasRsvp: boolean;
}

export function RsvpButton({
  eventId,
  isAuthenticated,
  hasRsvp: initialHasRsvp,
}: RsvpButtonProps) {
  const router = useRouter();
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Sign in with Google to RSVP for this event.
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
    <div>
      <button
        onClick={toggleRsvp}
        disabled={loading}
        className={`rounded-lg px-6 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
          hasRsvp
            ? "border border-pti-green bg-white text-pti-green hover:bg-pti-green/10"
            : "bg-pti-green text-white hover:bg-pti-green-dark"
        }`}
      >
        {loading
          ? "Updating..."
          : hasRsvp
            ? "Cancel RSVP"
            : "RSVP — I'm attending"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

interface AttendeeListProps {
  attendees: { display_name: string; avatar_url: string | null; user_id: string }[];
}

export function AttendeeList({ attendees }: AttendeeListProps) {
  if (attendees.length === 0) {
    return (
      <p className="text-sm text-gray-500">No one has RSVP&apos;d yet. Be the first!</p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-700">
        {attendees.length} {attendees.length === 1 ? "person" : "people"} attending
      </p>
      <div className="flex flex-wrap gap-3">
        {attendees.map((attendee) => (
          <div
            key={attendee.user_id}
            className="flex items-center gap-2 rounded-full bg-gray-50 py-1 pl-1 pr-3"
          >
            {attendee.avatar_url ? (
              <Image
                src={attendee.avatar_url}
                alt={attendee.display_name}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pti-green/20 text-xs font-medium text-pti-green">
                {attendee.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-gray-700">{attendee.display_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

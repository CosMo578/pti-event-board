"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EventOwnerActionsProps {
  eventId: string;
}

export function EventOwnerActions({ eventId }: EventOwnerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This cannot be undone.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete event.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Failed to delete event.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
      <Link
        href={`/events/${eventId}/edit`}
        className="rounded-lg border border-pti-green/30 px-4 py-2 text-sm font-medium text-pti-green transition-colors hover:bg-pti-green/10"
      >
        Edit event
      </Link>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {loading ? "Deleting..." : "Delete event"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:flex-wrap">
      <Button
        asChild
        variant="outline"
        className="h-10 w-full border-pti-green/30 text-pti-green hover:bg-pti-green/10 sm:w-auto"
      >
        <Link href={`/events/${eventId}/edit`}>Edit event</Link>
      </Button>
      <Button
        onClick={handleDelete}
        disabled={loading}
        variant="outline"
        className="h-10 w-full border-destructive/30 text-destructive hover:bg-destructive/10 sm:w-auto"
      >
        {loading ? "Deleting..." : "Delete event"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}

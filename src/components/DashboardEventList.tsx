"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  Eye,
  MapPin,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { CATEGORY_COLORS, categoryToLabel } from "@/lib/constants";
import { isPastEvent } from "@/lib/event-query";
import { htmlToPlainText } from "@/lib/rich-text";
import type { Event, EventRsvp } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export type DashboardEvent = Event & {
  rsvp_count: number;
  attendees: Pick<EventRsvp, "display_name" | "avatar_url" | "user_id">[];
};

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DashboardEventList({ events }: { events: DashboardEvent[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [attendeesEvent, setAttendeesEvent] = useState<DashboardEvent | null>(
    null,
  );

  const handleDelete = async (eventId: string, past: boolean) => {
    if (past) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this event? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeletingId(eventId);
    setError("");

    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete event.");
        setDeletingId(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to delete event.");
    } finally {
      setDeletingId(null);
    }
  };

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-lg font-medium">No events yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Create your first campus event to start tracking RSVPs.
        </p>
        <Button asChild className="mt-6">
          <Link href="/create">Create an event</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => {
          const past = isPastEvent(event.event_date);
          const badgeClass = CATEGORY_COLORS[event.category];

          return (
            <Card
              key={event.id}
              className="flex h-full min-w-0 flex-col gap-0 overflow-hidden py-0"
            >
              <CardHeader className="gap-2 p-4 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge className={`max-w-full truncate border-0 ${badgeClass}`}>
                    {categoryToLabel(event.category)}
                  </Badge>
                  <Badge variant={past ? "secondary" : "default"}>
                    {past ? "Past" : "Upcoming"}
                  </Badge>
                  <Badge variant="outline">
                    {event.visibility === "private" ? "Unlisted" : "Public"}
                  </Badge>
                </div>
                <CardTitle className="line-clamp-2 min-h-[2.5rem] text-base leading-snug">
                  <Link
                    href={`/events/${event.id}`}
                    className="hover:text-pti-green hover:underline"
                  >
                    {event.title}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {htmlToPlainText(event.description)}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex min-w-0 flex-1 flex-col gap-2 px-4 pb-3 text-sm text-muted-foreground">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" />
                  <span className="truncate">{formatDate(event.event_date)}</span>
                </span>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
                <span className="mt-auto inline-flex items-center gap-1.5 font-medium text-pti-green">
                  <Users className="size-3.5 shrink-0" />
                  {event.rsvp_count} RSVP{event.rsvp_count === 1 ? "" : "s"}
                </span>
              </CardContent>

              <Separator />

              <CardFooter className="grid grid-cols-2 gap-1.5 border-t-0 bg-transparent p-3">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/events/${event.id}`}>
                    <Eye className="size-3.5" />
                    View
                  </Link>
                </Button>
                {past ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled
                    title="Past events cannot be edited"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/events/${event.id}/edit`}>
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAttendeesEvent(event)}
                >
                  <Users className="size-3.5" />
                  Attendees
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={past || deletingId === event.id}
                  title={past ? "Past events cannot be deleted" : undefined}
                  onClick={() => handleDelete(event.id, past)}
                >
                  <Trash2 className="size-3.5" />
                  {deletingId === event.id ? "Deleting…" : "Delete"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={!!attendeesEvent}
        onOpenChange={(open) => {
          if (!open) setAttendeesEvent(null);
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendees</DialogTitle>
            <DialogDescription>
              {attendeesEvent?.title} — {attendeesEvent?.rsvp_count ?? 0}{" "}
              RSVP{(attendeesEvent?.rsvp_count ?? 0) === 1 ? "" : "s"}
            </DialogDescription>
          </DialogHeader>

          {!attendeesEvent?.attendees.length ? (
            <p className="text-sm text-muted-foreground">
              No one has RSVP&apos;d yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {attendeesEvent.attendees.map((attendee) => (
                <li
                  key={attendee.user_id}
                  className="flex min-w-0 items-center gap-3 rounded-lg bg-muted/60 px-3 py-2"
                >
                  {attendee.avatar_url ? (
                    <Image
                      src={attendee.avatar_url}
                      alt={attendee.display_name}
                      width={36}
                      height={36}
                      unoptimized
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pti-green/20 text-sm font-medium text-pti-green">
                      {attendee.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="min-w-0 truncate text-sm font-medium">
                    {attendee.display_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

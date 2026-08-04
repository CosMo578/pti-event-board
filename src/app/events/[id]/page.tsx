import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddToCalendar } from "@/components/AddToCalendar";
import { EventOwnerActions } from "@/components/EventOwnerActions";
import { HashtagList } from "@/components/HashtagList";
import { RichTextContent } from "@/components/RichTextContent";
import { AttendeeList, RsvpButton } from "@/components/RsvpButton";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS, categoryToLabel } from "@/lib/constants";
import { formatAttendingLabel, isPastEvent } from "@/lib/event-query";
import type { EventWithRsvps } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event, error } = await supabase
    .from("events")
    .select("*, event_rsvps(display_name, avatar_url, user_id)")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[event-detail] failed to load event", {
      id,
      code: error.code,
      message: error.message,
    });
    throw new Error(`Failed to load event: ${error.message}`);
  }

  if (!event) {
    notFound();
  }

  const typedEvent = event as EventWithRsvps;
  const attendees = typedEvent.event_rsvps ?? [];
  const isOwner = user?.id === typedEvent.created_by;
  const past = isPastEvent(typedEvent);
  const hasRsvp = user
    ? attendees.some((a) => a.user_id === user.id)
    : false;
  const isFull =
    typedEvent.max_attendees != null &&
    attendees.length >= typedEvent.max_attendees;
  const badgeClass = CATEGORY_COLORS[typedEvent.category];

  const hasEnd = !!(typedEvent.end_date && typedEvent.end_time);
  const sameDayEnd = hasEnd && typedEvent.end_date === typedEvent.event_date;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const shareUrl = `${siteUrl}/events/${typedEvent.id}`;

  return (
    <div className="w-full flex-1 sm:mx-auto sm:max-w-4xl sm:px-6 sm:py-8">
      <div className="px-4 pt-4 sm:px-0 sm:pt-0">
        <Button
          asChild
          variant="ghost"
          className="mb-4 -ml-2 h-9 gap-1.5 px-2 text-pti-green hover:bg-pti-green/10 hover:text-pti-green sm:mb-6"
        >
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to events
          </Link>
        </Button>
      </div>

      <article className="overflow-hidden border-y border-border bg-card shadow-sm sm:rounded-xl sm:border">
        <div className="relative aspect-[16/9] w-full bg-muted sm:aspect-[2/1]">
          {typedEvent.flyer_url ? (
            <Image
              src={typedEvent.flyer_url}
              alt={`${typedEvent.title} flyer`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 896px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-pti-green/10 to-pti-gold/20">
              <span className="text-6xl font-bold text-pti-green/30">PTI</span>
            </div>
          )}
        </div>

        <div className="space-y-6 p-4 sm:p-6 md:p-8">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`max-w-full truncate rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
              >
                {categoryToLabel(typedEvent.category)}
              </span>
              {typedEvent.visibility === "private" && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Unlisted event
                </span>
              )}
              {past && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Past event
                </span>
              )}
              {!past && isFull && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Full
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold break-words text-foreground sm:text-3xl">
              {typedEvent.title}
            </h1>
          </div>

          <HashtagList hashtags={typedEvent.hashtags ?? []} />

          <section className="min-w-0">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              About
            </h2>
            <RichTextContent
              content={typedEvent.description}
              className="mt-2"
            />
          </section>

          <section className="flex min-w-0 items-center gap-3">
            {typedEvent.host_avatar_url ? (
              <Image
                src={typedEvent.host_avatar_url}
                alt={typedEvent.host_name}
                width={40}
                height={40}
                unoptimized
                className="size-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pti-green/20 text-sm font-medium text-pti-green">
                {typedEvent.host_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Hosted by
              </p>
              <p className="truncate font-medium text-foreground">
                {typedEvent.host_name}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            <p className="inline-flex max-w-full items-center gap-1.5">
              <CalendarDays
                className="size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span className="sr-only">Date:</span>
              <span className="break-words text-foreground">
                {hasEnd && !sameDayEnd
                  ? `${formatDate(typedEvent.event_date)} – ${formatDate(typedEvent.end_date!)}`
                  : formatDate(typedEvent.event_date)}
              </span>
            </p>
            <p className="inline-flex max-w-full items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Time:</span>
              <span className="text-foreground">
                {hasEnd
                  ? `${formatTime(typedEvent.event_time)} – ${formatTime(typedEvent.end_time!)}`
                  : formatTime(typedEvent.event_time)}
              </span>
            </p>
            <p className="inline-flex max-w-full items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Location:</span>
              <span className="break-words text-foreground">
                {typedEvent.location}
              </span>
            </p>
            <p className="inline-flex max-w-full items-center gap-1.5">
              <Users className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Capacity:</span>
              <span className="text-foreground">
                {formatAttendingLabel(attendees.length, typedEvent.max_attendees)}
              </span>
            </p>
          </section>

          {!past && (
            <>
              <section className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
                <ShareButton title={typedEvent.title} url={shareUrl} />
                <AddToCalendar event={typedEvent} />
              </section>

              <section className="min-w-0">
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                  Register
                </h2>
                <RsvpButton
                  eventId={typedEvent.id}
                  isAuthenticated={!!user}
                  hasRsvp={hasRsvp}
                  isFull={isFull}
                />
              </section>
            </>
          )}

          <section className="min-w-0">
            <h2 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              Attendees
            </h2>
            <AttendeeList
              attendees={attendees}
              isPast={past}
              maxAttendees={typedEvent.max_attendees}
            />
          </section>

          {isOwner && (
            <EventOwnerActions eventId={typedEvent.id} isPast={past} />
          )}
        </div>
      </article>
    </div>
  );
}

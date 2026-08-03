import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AddToCalendar } from "@/components/AddToCalendar";
import { EventOwnerActions } from "@/components/EventOwnerActions";
import { HashtagList } from "@/components/HashtagList";
import { AttendeeList, RsvpButton } from "@/components/RsvpButton";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { CATEGORY_COLORS, categoryToLabel } from "@/lib/constants";
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

  if (error || !event) {
    notFound();
  }

  const typedEvent = event as EventWithRsvps;
  const attendees = typedEvent.event_rsvps ?? [];
  const isOwner = user?.id === typedEvent.created_by;
  const hasRsvp = user
    ? attendees.some((a) => a.user_id === user.id)
    : false;
  const badgeClass = CATEGORY_COLORS[typedEvent.category];

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
  const shareUrl = `${siteUrl}/events/${typedEvent.id}`;

  return (
    <div className="mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <Button
        asChild
        variant="ghost"
        className="mb-6 -ml-2 h-9 gap-1.5 px-2 text-pti-green hover:bg-pti-green/10 hover:text-pti-green"
      >
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to events
        </Link>
      </Button>

      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="relative aspect-[16/9] w-full bg-gray-100">
          {typedEvent.flyer_url ? (
            <Image
              src={typedEvent.flyer_url}
              alt={`${typedEvent.title} flyer`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-pti-green/10 to-pti-gold/20">
              <span className="text-6xl font-bold text-pti-green/30">PTI</span>
            </div>
          )}
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
                >
                  {categoryToLabel(typedEvent.category)}
                </span>
                {typedEvent.visibility === "private" && (
                  <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    Unlisted event
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {typedEvent.title}
              </h1>
            </div>
          </div>

          <HashtagList hashtags={typedEvent.hashtags ?? []} />

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              About
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">
              {typedEvent.description}
            </p>
          </section>

          <section className="flex items-center gap-3">
            {typedEvent.host_avatar_url ? (
              <Image
                src={typedEvent.host_avatar_url}
                alt={typedEvent.host_name}
                width={40}
                height={40}
                unoptimized
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pti-green/20 text-sm font-medium text-pti-green">
                {typedEvent.host_name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Hosted by
              </p>
              <p className="font-medium text-gray-900">{typedEvent.host_name}</p>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Date
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatDate(typedEvent.event_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Time
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formatTime(typedEvent.event_time)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Venue
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {typedEvent.location}
              </p>
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <ShareButton title={typedEvent.title} url={shareUrl} />
            <AddToCalendar event={typedEvent} />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Register
            </h2>
            <RsvpButton
              eventId={typedEvent.id}
              isAuthenticated={!!user}
              hasRsvp={hasRsvp}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Attendees
            </h2>
            <AttendeeList attendees={attendees} />
          </section>

          {isOwner && <EventOwnerActions eventId={typedEvent.id} />}
        </div>
      </article>
    </div>
  );
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import { EventViewToggle } from "@/components/EventViewToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { labelToCategory } from "@/lib/constants";
import {
  escapeIlike,
  normalizeHashtagQuery,
  todayDateString,
} from "@/lib/event-query";
import type { Event, EventWithRsvpCount } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{
    category?: string;
    auth?: string;
    view?: string;
    q?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showPast = !!user;
  const today = todayDateString();
  const isPast = showPast && params.view === "past";

  let query = supabase
    .from("events")
    .select("*, event_rsvps(count)")
    .eq("visibility", "public");

  if (isPast) {
    query = query
      .lt("event_date", today)
      .order("event_date", { ascending: false })
      .order("event_time", { ascending: false });
  } else {
    query = query
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });
  }

  if (params.category && params.category !== "all") {
    const category = labelToCategory(params.category);
    if (category) {
      query = query.eq("category", category);
    }
  }

  const rawQ = params.q?.trim() ?? "";
  if (rawQ) {
    const escaped = escapeIlike(rawQ);
    const tag = normalizeHashtagQuery(rawQ);
    if (tag) {
      query = query.or(
        `title.ilike.%${escaped}%,hashtags.cs.{${tag}}`,
      );
    } else {
      query = query.ilike("title", `%${escaped}%`);
    }
  }

  const { data: events, error } = await query;

  const eventsWithCount: EventWithRsvpCount[] = (events ?? []).map((row) => {
    const { event_rsvps, ...event } = row as Event & {
      event_rsvps: { count: number }[];
    };
    return {
      ...(event as Event),
      rsvp_count: event_rsvps?.[0]?.count ?? 0,
    };
  });

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h1 className="min-w-0 flex-1 text-base font-bold leading-snug text-foreground sm:text-2xl sm:leading-tight md:text-3xl">
            {isPast ? "Past Campus Events" : "Upcoming Campus Events"}
          </h1>
          {showPast && (
            <Suspense
              fallback={
                <div
                  className="h-8 w-36 shrink-0 rounded-full bg-muted sm:h-9 sm:w-[11.5rem]"
                  aria-hidden
                />
              }
            >
              <EventViewToggle />
            </Suspense>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Discover what&apos;s happening at PTI, Effurun — seminars, sports,
          socials, and more.
          {!showPast && (
            <> Sign in to browse past events and manage your own.</>
          )}
        </p>

        {params.auth === "required" && (
          <Alert className="mt-4 border-amber-200 bg-amber-50 text-amber-900">
            <AlertDescription>
              Please sign in with Google to create an event.
            </AlertDescription>
          </Alert>
        )}
        {params.auth === "error" && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              Sign-in failed. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </section>

      <Suspense fallback={<div className="mb-6 h-11" />}>
        <EventFilters />
      </Suspense>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load events. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {!error && eventsWithCount.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            {isPast ? "No past events" : "No upcoming events"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {rawQ || (params.category && params.category !== "all")
              ? "Try a different search or category."
              : isPast
                ? "Past events will appear here once they have ended."
                : "Check back soon or create a new event if you're signed in."}
          </p>
        </div>
      )}

      {eventsWithCount.length > 0 && (
        <div className="grid w-full auto-rows-fr grid-cols-1 items-stretch justify-items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {eventsWithCount.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

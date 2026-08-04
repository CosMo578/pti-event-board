import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  DashboardEventList,
  type DashboardEvent,
} from "@/components/DashboardEventList";
import { Button } from "@/components/ui/button";
import type { Event, EventRsvp } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proxy redirects signed-out users; this is a safety net for RSC.
  if (!user) {
    return null;
  }

  const { data: events, error } = await supabase
    .from("events")
    .select("*, event_rsvps(display_name, avatar_url, user_id)")
    .eq("created_by", user.id)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false });

  const dashboardEvents: DashboardEvent[] = (events ?? []).map((row) => {
    const { event_rsvps, ...event } = row as Event & {
      event_rsvps: Pick<EventRsvp, "display_name" | "avatar_url" | "user_id">[];
    };
    const attendees = event_rsvps ?? [];
    return {
      ...(event as Event),
      rsvp_count: attendees.length,
      attendees,
    };
  });

  const upcomingCount = dashboardEvents.filter(
    (e) => e.event_date >= new Date().toISOString().split("T")[0],
  ).length;
  const totalRsvps = dashboardEvents.reduce((sum, e) => sum + e.rsvp_count, 0);

  return (
    <div className="mx-auto max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-pti-green sm:text-3xl">
            Creator Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Manage your events, track RSVPs, and update details.
          </p>
        </div>
        <Button asChild className="h-10 w-full shrink-0 sm:w-auto">
          <Link href="/create">Create new event</Link>
        </Button>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Your events
          </p>
          <p className="mt-1 text-2xl font-bold text-pti-green">
            {dashboardEvents.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Upcoming
          </p>
          <p className="mt-1 text-2xl font-bold text-pti-green">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Total RSVPs
          </p>
          <p className="mt-1 text-2xl font-bold text-pti-green">{totalRsvps}</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load your events. Please try again later.
        </p>
      )}

      <DashboardEventList events={dashboardEvents} />
    </div>
  );
}

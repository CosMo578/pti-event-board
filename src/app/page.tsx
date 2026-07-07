import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { EventCard } from "@/components/EventCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SubscribeForm } from "@/components/SubscribeForm";
import { labelToCategory } from "@/lib/constants";
import type { Event } from "@/lib/types/database";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ category?: string; auth?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("events")
    .select("*")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  if (params.category && params.category !== "all") {
    const category = labelToCategory(params.category);
    if (category) {
      query = query.eq("category", category);
    }
  }

  const { data: events, error } = await query;

  return (
    <div className="mx-auto max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-8">
        <h1 className="text-2xl font-bold text-pti-green sm:text-3xl">
          Upcoming Campus Events
        </h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Discover what&apos;s happening at PTI, Effurun — seminars, sports,
          socials, and more.
        </p>

        {params.auth === "required" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please sign in with Google to post an event.
          </p>
        )}
        {params.auth === "error" && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            Sign-in failed. Please try again.
          </p>
        )}
      </section>

      <section className="mb-6">
        <Suspense fallback={<div className="h-9" />}>
          <CategoryFilter />
        </Suspense>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          Failed to load events. Please try again later.
        </p>
      )}

      {!error && (!events || events.length === 0) && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-medium text-gray-700">No upcoming events</p>
          <p className="mt-2 text-sm text-gray-500">
            Check back soon or post a new event if you&apos;re signed in.
          </p>
        </div>
      )}

      {events && events.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(events as Event[]).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <section className="mt-12">
        <SubscribeForm />
      </section>
    </div>
  );
}

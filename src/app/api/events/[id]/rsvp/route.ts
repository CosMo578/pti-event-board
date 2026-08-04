import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPastEvent } from "@/lib/event-query";
import { getGoogleAvatarUrl, getGoogleDisplayName } from "@/lib/google-user";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, event_date")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (isPastEvent(event.event_date)) {
    return NextResponse.json(
      { error: "Cannot RSVP to a past event." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase
    .from("event_rsvps")
    .upsert(
      {
        event_id: eventId,
        user_id: user.id,
        display_name: getGoogleDisplayName(user),
        avatar_url: getGoogleAvatarUrl(user),
      },
      { onConflict: "event_id,user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: eventId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, event_date")
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (isPastEvent(event.event_date)) {
    return NextResponse.json(
      { error: "Cannot change RSVP for a past event." },
      { status: 403 },
    );
  }

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

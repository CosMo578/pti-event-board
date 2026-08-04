import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPastEvent } from "@/lib/event-query";
import { getGoogleAvatarUrl, getGoogleDisplayName } from "@/lib/google-user";
import {
  updateEventSchema,
  validateEventSchedule,
} from "@/lib/validations/event";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select(
      "created_by, event_date, event_time, end_date, end_time, max_attendees",
    )
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code !== "PGRST116") {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPastEvent(existing)) {
    return NextResponse.json(
      { error: "Past events cannot be updated." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const merged = {
    event_date: parsed.data.event_date ?? existing.event_date,
    event_time: parsed.data.event_time ?? existing.event_time,
    end_date:
      "end_date" in parsed.data
        ? (parsed.data.end_date ?? null)
        : existing.end_date,
    end_time:
      "end_time" in parsed.data
        ? (parsed.data.end_time ?? null)
        : existing.end_time,
  };

  const scheduleError = validateEventSchedule(merged);
  if (scheduleError) {
    return NextResponse.json({ error: scheduleError }, { status: 400 });
  }

  if (
    "max_attendees" in parsed.data &&
    parsed.data.max_attendees != null
  ) {
    const { count, error: countError } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count ?? 0) > parsed.data.max_attendees) {
      return NextResponse.json(
        {
          error: `Cannot set max attendees below the current RSVP count (${count}).`,
        },
        { status: 400 },
      );
    }
  }

  const { data, error } = await supabase
    .from("events")
    .update({
      ...parsed.data,
      host_name: getGoogleDisplayName(user),
      host_avatar_url: getGoogleAvatarUrl(user),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("events")
    .select("created_by, event_date, end_date, end_time")
    .eq("id", id)
    .single();

  if (fetchError) {
    if (fetchError.code !== "PGRST116") {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (existing.created_by !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isPastEvent(existing)) {
    return NextResponse.json(
      { error: "Past events cannot be deleted." },
      { status: 403 },
    );
  }

  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

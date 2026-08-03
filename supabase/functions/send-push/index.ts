import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const authHeader = req.headers.get("Authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:events@pti.edu.ng";
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://pti-event-board.vercel.app";

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  let body: { type?: string; eventId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let payload: PushPayload;

  if (body.type === "new_event" && body.eventId) {
    const { data: event, error } = await supabase
      .from("events")
      .select("id, title, event_date, visibility")
      .eq("id", body.eventId)
      .single();

    if (error || !event || event.visibility !== "public") {
      return new Response(JSON.stringify({ sent: 0, message: "Event not found or not public" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    payload = {
      title: "New PTI Event Posted",
      body: event.title,
      url: `${siteUrl}/events/${event.id}`,
    };
  } else {
    const today = new Date().toISOString().split("T")[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    const { data: events } = await supabase
      .from("events")
      .select("id, title")
      .eq("visibility", "public")
      .gte("event_date", today)
      .lte("event_date", nextWeekStr)
      .order("event_date", { ascending: true })
      .limit(5);

    const count = events?.length ?? 0;
    if (count === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No upcoming events" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    payload = {
      title: "PTI Daily Event Digest",
      body:
        count === 1
          ? `1 upcoming event: ${events![0].title}`
          : `${count} upcoming events — tap to view`,
      url: siteUrl,
    };
  }

  const { data: enabledUsers } = await supabase
    .from("notification_preferences")
    .select("user_id")
    .eq("push_enabled", true);

  if (!enabledUsers?.length) {
    return new Response(JSON.stringify({ sent: 0, message: "No push-enabled users" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = enabledUsers.map((u) => u.user_id);

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .in("user_id", userIds);

  if (!subscriptions?.length) {
    return new Response(JSON.stringify({ sent: 0, message: "No push subscriptions" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let sent = 0;
  const errors: string[] = [];
  const staleIds: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        staleIds.push(sub.id);
      } else {
        errors.push(`${sub.endpoint}: ${String(err)}`);
      }
    }
  }

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return new Response(
    JSON.stringify({
      sent,
      subscriptions: subscriptions.length,
      staleRemoved: staleIds.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

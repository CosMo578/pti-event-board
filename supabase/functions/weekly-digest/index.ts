import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Event {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildEmailHtml(events: Event[], siteUrl: string) {
  const eventRows = events
    .map(
      (e) => `
      <tr>
        <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
          <h3 style="margin:0 0 8px;color:#1b5e20;font-size:16px;">${e.title}</h3>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">
            <strong>Category:</strong> ${capitalize(e.category)}
          </p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">
            <strong>Date:</strong> ${formatDate(e.event_date)}
          </p>
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;">
            <strong>Time:</strong> ${formatTime(e.event_time)}
          </p>
          <p style="margin:0;color:#6b7280;font-size:13px;">
            <strong>Location:</strong> ${e.location}
          </p>
        </td>
      </tr>`,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f8f6f0;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#1b5e20;color:white;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:22px;">PTI Campus Event Digest</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">
            Petroleum Training Institute, Effurun
          </p>
        </div>
        <div style="background:white;padding:24px;border-radius:0 0 8px 8px;">
          <p style="color:#374151;font-size:15px;">
            Here are the upcoming campus events for the next 7 days:
          </p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px;">
            ${eventRows}
          </table>
          <p style="margin-top:24px;text-align:center;">
            <a href="${siteUrl}" style="display:inline-block;background:#1b5e20;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;">
              View All Events
            </a>
          </p>
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
          You received this because you subscribed to the PTI Event Board digest.
        </p>
      </div>
    </body>
    </html>`;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "PTI Events <onboarding@resend.dev>";
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://pti-event-board.vercel.app";

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const todayStr = today.toISOString().split("T")[0];
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("title, description, event_date, event_time, location, category")
    .gte("event_date", todayStr)
    .lte("event_date", nextWeekStr)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  if (eventsError) {
    return new Response(JSON.stringify({ error: eventsError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: subscribers, error: subsError } = await supabase
    .from("subscribers")
    .select("email");

  if (subsError) {
    return new Response(JSON.stringify({ error: subsError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!events?.length || !subscribers?.length) {
    return new Response(
      JSON.stringify({
        sent: 0,
        events: events?.length ?? 0,
        message: "No events or subscribers to process",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const html = buildEmailHtml(events as Event[], siteUrl);
  let sent = 0;
  const errors: string[] = [];

  for (const { email } of subscribers) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: `PTI Weekly Event Digest — ${events.length} upcoming event${events.length === 1 ? "" : "s"}`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        errors.push(`${email}: ${err}`);
      }
    } catch (err) {
      errors.push(`${email}: ${String(err)}`);
    }
  }

  return new Response(
    JSON.stringify({
      sent,
      events: events.length,
      subscribers: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

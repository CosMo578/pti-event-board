import { htmlToPlainText } from "@/lib/rich-text";
import type { Event } from "@/lib/types/database";

function padTime(timeStr: string): string {
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
}

function toUtcIcsDate(dateStr: string, timeStr: string): string {
  const iso = `${dateStr}T${padTime(timeStr)}`;
  const d = new Date(iso);
  const end = new Date(d.getTime() + 60 * 60 * 1000);
  const fmt = (dt: Date) =>
    dt
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return `${fmt(d)}/${fmt(end)}`;
}

export function buildGoogleCalendarUrl(event: Event): string {
  const start = `${event.event_date}T${padTime(event.event_time)}`;
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z/, "Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(startDate)}/${fmt(endDate)}`,
    details: htmlToPlainText(event.description),
    location: event.location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcsContent(event: Event): string {
  const uid = `${event.id}@pti-event-board`;
  const dtstamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z/, "Z");

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PTI Event Board//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${toUtcIcsDate(event.event_date, event.event_time).split("/")[0]}`,
    `DTEND:${toUtcIcsDate(event.event_date, event.event_time).split("/")[1]}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(htmlToPlainText(event.description))}`,
    `LOCATION:${escape(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

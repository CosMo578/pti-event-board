import { htmlToPlainText } from "@/lib/rich-text";
import type { Event } from "@/lib/types/database";

function padTime(timeStr: string): string {
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
}

function toDate(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${padTime(timeStr)}`);
}

function defaultEndDate(start: Date): Date {
  return new Date(start.getTime() + 60 * 60 * 1000);
}

function resolveEventBounds(event: Event): { start: Date; end: Date } {
  const start = toDate(event.event_date, event.event_time);
  if (event.end_date && event.end_time) {
    return { start, end: toDate(event.end_date, event.end_time) };
  }
  return { start, end: defaultEndDate(start) };
}

function fmtUtcIcs(dt: Date): string {
  return dt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function fmtGoogle(dt: Date): string {
  return dt
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z/, "Z");
}

export function buildGoogleCalendarUrl(event: Event): string {
  const { start, end } = resolveEventBounds(event);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmtGoogle(start)}/${fmtGoogle(end)}`,
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
  const { start, end } = resolveEventBounds(event);

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PTI Event Board//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmtUtcIcs(start)}`,
    `DTEND:${fmtUtcIcs(end)}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(htmlToPlainText(event.description))}`,
    `LOCATION:${escape(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

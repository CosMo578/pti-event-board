/** Escape % and _ for safe PostgREST ilike patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Normalize a search term into an optional hashtag slug (no leading #). */
export function normalizeHashtagQuery(value: string): string | null {
  const trimmed = value.trim().replace(/^#+/, "").toLowerCase();
  if (!trimmed || !/^[a-z0-9_-]+$/i.test(trimmed)) return null;
  return trimmed;
}

/** Today's date as YYYY-MM-DD (UTC), matching homepage/dashboard filtering. */
export function todayDateString(now = new Date()): string {
  return now.toISOString().split("T")[0];
}

/** Current UTC time as HH:MM:SS for PostgREST time comparisons. */
export function nowTimeString(now = new Date()): string {
  return now.toISOString().slice(11, 19);
}

function padTime(timeStr: string): string {
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
}

export type EventPastCheck = {
  event_date: string;
  end_date?: string | null;
  end_time?: string | null;
};

/**
 * Past when end datetime has passed (if end is set);
 * otherwise when event_date is strictly before today (date-only).
 */
export function isPastEvent(event: EventPastCheck, now = new Date()): boolean {
  if (event.end_date && event.end_time) {
    const end = new Date(
      `${event.end_date}T${padTime(event.end_time)}`,
    );
    return end.getTime() <= now.getTime();
  }
  return event.event_date < todayDateString(now);
}

/**
 * PostgREST `.or()` filter for upcoming events (not past),
 * accounting for optional end_date/end_time.
 */
export function upcomingEventsOrFilter(
  today: string,
  nowTime: string,
): string {
  return [
    `and(end_date.is.null,event_date.gte.${today})`,
    `end_date.gt.${today}`,
    `and(end_date.eq.${today},end_time.gte.${nowTime})`,
  ].join(",");
}

/**
 * PostgREST `.or()` filter for past events,
 * accounting for optional end_date/end_time.
 */
export function pastEventsOrFilter(today: string, nowTime: string): string {
  return [
    `and(end_date.is.null,event_date.lt.${today})`,
    `end_date.lt.${today}`,
    `and(end_date.eq.${today},end_time.lt.${nowTime})`,
  ].join(",");
}

/** Display label for RSVP count with optional capacity. */
export function formatAttendingLabel(
  count: number,
  maxAttendees: number | null | undefined,
): string {
  if (maxAttendees != null) {
    return `${count} / ${maxAttendees} attending`;
  }
  return `${count} attending`;
}

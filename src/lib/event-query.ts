/** Escape % and _ for safe PostgREST ilike patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** RFC 4122 UUID string (any version), case-insensitive. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

/**
 * PostgREST/Postgres errors that mean an event id cannot resolve to a row.
 * PGRST116 = .single() matched zero rows; 22P02 = invalid uuid syntax.
 * Other codes (connection/auth/server) must remain hard failures.
 */
export function isEventLookupNotFoundError(
  error: { code?: string } | null | undefined,
): boolean {
  return error?.code === "PGRST116" || error?.code === "22P02";
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

/** Current UTC time as HH:MM for minute-granularity form/API checks. */
export function nowTimeMinuteString(now = new Date()): string {
  return now.toISOString().slice(11, 16);
}

/**
 * Whether an event start is in the past.
 *
 * Uses UTC calendar date + UTC clock time (minute precision), matching
 * `todayDateString` / `nowTimeString` used by homepage and dashboard filters.
 * Stored `event_date` / `event_time` are compared as those UTC strings — not
 * reinterpreted in the browser's local timezone.
 */
export function isEventStartInPast(
  eventDate: string,
  eventTime: string,
  now = new Date(),
): boolean {
  return getEventStartPastError(eventDate, eventTime, now) !== null;
}

/** User-facing error if start date/time is before "now" (UTC, minute precision). */
export function getEventStartPastError(
  eventDate: string,
  eventTime: string,
  now = new Date(),
): string | null {
  const today = todayDateString(now);
  if (eventDate < today) {
    return "Event date cannot be in the past";
  }
  if (eventDate === today) {
    const time = eventTime.slice(0, 5);
    if (time < nowTimeMinuteString(now)) {
      return "Event time must be now or later when the date is today";
    }
  }
  return null;
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

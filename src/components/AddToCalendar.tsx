"use client";

import { buildGoogleCalendarUrl, buildIcsContent } from "@/lib/calendar";
import type { Event } from "@/lib/types/database";

export function AddToCalendar({ event }: { event: Event }) {
  const googleUrl = buildGoogleCalendarUrl(event);

  const downloadIcs = () => {
    const content = buildIcsContent(event);
    const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-").slice(0, 50)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-pti-green/30 px-4 py-2 text-sm font-medium text-pti-green transition-colors hover:bg-pti-green/10"
      >
        Google Calendar
      </a>
      <button
        onClick={downloadIcs}
        className="rounded-lg border border-pti-green/30 px-4 py-2 text-sm font-medium text-pti-green transition-colors hover:bg-pti-green/10"
      >
        Download .ics
      </button>
    </div>
  );
}

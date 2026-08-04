"use client";

import { buildGoogleCalendarUrl, buildIcsContent } from "@/lib/calendar";
import type { Event } from "@/lib/types/database";
import { Button } from "@/components/ui/button";

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
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
      <Button
        asChild
        variant="outline"
        className="h-10 w-full border-pti-green/30 text-pti-green hover:bg-pti-green/10 sm:w-auto"
      >
        <a href={googleUrl} target="_blank" rel="noopener noreferrer">
          Google Calendar
        </a>
      </Button>
      <Button
        onClick={downloadIcs}
        variant="outline"
        className="h-10 w-full border-pti-green/30 text-pti-green hover:bg-pti-green/10 sm:w-auto"
      >
        Download .ics
      </Button>
    </div>
  );
}

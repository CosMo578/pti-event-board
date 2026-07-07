import Image from "next/image";
import { CATEGORY_COLORS, categoryToLabel } from "@/lib/constants";
import type { Event } from "@/lib/types/database";

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("en-NG", {
    weekday: "short",
    year: "numeric",
    month: "short",
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

export function EventCard({ event }: { event: Event }) {
  const badgeClass = CATEGORY_COLORS[event.category];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] w-full bg-gray-100">
        {event.flyer_url ? (
          <Image
            src={event.flyer_url}
            alt={`${event.title} flyer`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-pti-green/10 to-pti-gold/20">
            <span className="text-4xl font-bold text-pti-green/30">PTI</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">{event.title}</h2>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
          >
            {categoryToLabel(event.category)}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-gray-600">{event.description}</p>

        <div className="mt-auto space-y-1 text-sm text-gray-500">
          <p>
            <span className="font-medium text-gray-700">Date:</span>{" "}
            {formatDate(event.event_date)}
          </p>
          <p>
            <span className="font-medium text-gray-700">Time:</span>{" "}
            {formatTime(event.event_time)}
          </p>
          <p>
            <span className="font-medium text-gray-700">Location:</span>{" "}
            {event.location}
          </p>
        </div>
      </div>
    </article>
  );
}

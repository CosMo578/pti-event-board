import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { CATEGORY_COLORS, categoryToLabel } from "@/lib/constants";
import { htmlToPlainText } from "@/lib/rich-text";
import type { EventWithRsvpCount } from "@/lib/types/database";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export function EventCard({ event }: { event: EventWithRsvpCount }) {
  const badgeClass = CATEGORY_COLORS[event.category];

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex h-full min-h-0 w-full min-w-0"
    >
      <Card className="flex h-full w-full min-w-0 flex-col gap-0 overflow-hidden py-0 transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[16/9] w-full shrink-0 bg-muted">
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

        <CardHeader className="gap-2 p-4 pb-2">
          <Badge className={`w-fit max-w-full truncate border-0 ${badgeClass}`}>
            {categoryToLabel(event.category)}
          </Badge>
          <CardTitle className="line-clamp-2 min-h-[2.75rem] text-lg leading-snug group-hover:text-pti-green">
            {event.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 min-h-[2.5rem]">
            {htmlToPlainText(event.description)}
          </CardDescription>
        </CardHeader>

        <CardContent className="h-7 overflow-hidden px-4 pb-2">
          {event.hashtags?.length > 0 ? (
            <div className="flex flex-nowrap gap-1 overflow-hidden">
              {event.hashtags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="truncate rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="mt-auto flex-col items-start gap-1.5 border-t-0 bg-transparent px-4 pt-0 pb-4 text-sm text-muted-foreground">
          <p className="inline-flex max-w-full items-center gap-1.5">
            <CalendarDays
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="sr-only">Date:</span>
            <span className="truncate">{formatDate(event.event_date)}</span>
          </p>
          <p className="inline-flex max-w-full items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Time:</span>
            <span className="truncate">{formatTime(event.event_time)}</span>
          </p>
          <p className="inline-flex h-5 max-w-full items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Location:</span>
            <span className="truncate">{event.location}</span>
          </p>
          <p
            className={`flex h-5 items-center gap-1.5 font-medium text-pti-green ${
              event.rsvp_count > 0 ? "" : "invisible"
            }`}
            aria-hidden={event.rsvp_count > 0 ? undefined : true}
          >
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            {event.rsvp_count} attending
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}

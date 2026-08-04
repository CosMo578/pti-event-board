"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EventViewToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const view = searchParams.get("view") === "past" ? "past" : "upcoming";

  const setView = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "past") {
      params.set("view", "past");
    } else {
      params.delete("view");
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/");
    });
  };

  return (
    <Tabs
      value={view}
      onValueChange={setView}
      className={`w-fit shrink-0 ${isPending ? "opacity-80" : ""}`}
      aria-busy={isPending}
    >
      <TabsList
        aria-label="Event time range"
        className="h-8 gap-0.5 rounded-full bg-muted p-0.5 sm:h-9"
      >
        <TabsTrigger
          value="upcoming"
          className="h-7 rounded-full px-2.5 text-xs font-semibold text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm sm:h-8 sm:px-3.5 sm:text-sm"
        >
          Upcoming
        </TabsTrigger>
        <TabsTrigger
          value="past"
          className="h-7 rounded-full px-2.5 text-xs font-semibold text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-sm sm:h-8 sm:px-3.5 sm:text-sm"
        >
          Past
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventFiltersProps {
  showPast: boolean;
}

export function EventFilters({ showPast }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const view = searchParams.get("view") === "past" && showPast ? "past" : "upcoming";
  const category = searchParams.get("category")?.toLowerCase() ?? "all";
  const qParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(qParam);

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/?${qs}` : "/");
    });
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = query.trim();
      const current = qParam.trim();
      if (trimmed === current) return;
      updateParams({ q: trimmed || null });
    }, 300);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce search input only
  }, [query]);

  return (
    <div
      className={`mb-6 space-y-4 ${isPending ? "opacity-80" : ""}`}
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {showPast ? (
          <Tabs
            value={view}
            onValueChange={(next) =>
              updateParams({ view: next === "past" ? "past" : null })
            }
            className="w-full shrink-0 lg:w-auto"
          >
            <TabsList
              aria-label="Event time range"
              className="h-11 w-full gap-1 rounded-xl bg-pti-green/10 p-1 sm:w-auto sm:min-w-[280px]"
            >
              <TabsTrigger
                value="upcoming"
                className="h-9 flex-1 rounded-lg px-5 text-sm font-semibold text-pti-green/70 data-active:bg-pti-green data-active:text-white data-active:shadow-sm sm:flex-none sm:px-8"
              >
                Upcoming
              </TabsTrigger>
              <TabsTrigger
                value="past"
                className="h-9 flex-1 rounded-lg px-5 text-sm font-semibold text-pti-green/70 data-active:bg-pti-green data-active:text-white data-active:shadow-sm sm:flex-none sm:px-8"
              >
                Past
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:max-w-xl lg:flex-1">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events by name or hashtag…"
              className="h-11 pl-9"
              aria-label="Search events"
            />
          </div>

          <Select
            value={category}
            onValueChange={(next) =>
              updateParams({ category: next === "all" ? null : next })
            }
          >
            <SelectTrigger
              className="h-11 w-full shrink-0 sm:w-[200px]"
              aria-label="Filter by category"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { EVENT_CATEGORIES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const category = searchParams.get("category")?.toLowerCase() ?? "all";
  const qParam = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(qParam);
  const [syncedQParam, setSyncedQParam] = useState(qParam);

  // Sync local search draft when the URL `q` changes externally (back/forward, etc.).
  if (qParam !== syncedQParam) {
    setSyncedQParam(qParam);
    setQuery(qParam);
  }

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
      className={`mb-6 ${isPending ? "opacity-80" : ""}`}
      aria-busy={isPending}
    >
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or hashtag…"
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
            className="h-11 w-full shrink-0 sm:w-[11.5rem] md:w-[200px]"
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
  );
}

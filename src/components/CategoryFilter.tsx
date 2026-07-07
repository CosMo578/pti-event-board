"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { EVENT_CATEGORIES } from "@/lib/constants";

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category")?.toLowerCase() ?? "all";

  const setCategory = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category.toLowerCase());
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setCategory("all")}
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          active === "all"
            ? "bg-pti-green text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        All
      </button>
      {EVENT_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => setCategory(category)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            active === category.toLowerCase()
              ? "bg-pti-green text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

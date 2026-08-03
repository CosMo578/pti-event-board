"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_FLYER_TYPES,
  EVENT_CATEGORIES,
  MAX_FLYER_SIZE,
  categoryToLabel,
  labelToCategory,
} from "@/lib/constants";
import { formatHashtagsForInput, parseHashtagsInput } from "@/lib/hashtags";
import type { Event, EventVisibility } from "@/lib/types/database";

interface EventFormProps {
  mode?: "create" | "edit";
  event?: Event;
}

export function EventForm({ mode = "create", event }: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventDate, setEventDate] = useState(event?.event_date ?? "");
  const [eventTime, setEventTime] = useState(
    event?.event_time?.slice(0, 5) ?? "",
  );
  const [location, setLocation] = useState(event?.location ?? "");
  const [category, setCategory] = useState(
    event ? categoryToLabel(event.category) : "",
  );
  const [visibility, setVisibility] = useState<EventVisibility>(
    event?.visibility ?? "public",
  );
  const [hashtagsInput, setHashtagsInput] = useState(
    formatHashtagsForInput(event?.hashtags),
  );
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(
    event?.flyer_url ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !ALLOWED_FLYER_TYPES.includes(
        file.type as (typeof ALLOWED_FLYER_TYPES)[number],
      )
    ) {
      setError("Only JPG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > MAX_FLYER_SIZE) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    setError("");
    setFlyer(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to post an event.");
        setLoading(false);
        return;
      }

      let flyerUrl: string | null = event?.flyer_url ?? null;

      if (flyer) {
        const ext = flyer.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("event-flyers")
          .upload(path, flyer, { contentType: flyer.type });

        if (uploadError) {
          setError("Failed to upload flyer. Please try again.");
          setLoading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("event-flyers").getPublicUrl(path);

        flyerUrl = publicUrl;
      }

      const categoryValue = labelToCategory(category);
      if (!categoryValue) {
        setError("Please select a valid category.");
        setLoading(false);
        return;
      }

      const payload = {
        title,
        description,
        event_date: eventDate,
        event_time: eventTime,
        location,
        category: categoryValue,
        flyer_url: flyerUrl,
        visibility,
        hashtags: parseHashtagsInput(hashtagsInput),
      };

      const url =
        mode === "edit" && event ? `/api/events/${event.id}` : "/api/events";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to save event.");
        setLoading(false);
        return;
      }

      router.push(`/events/${data.id ?? event?.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Event Title
        </label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          placeholder="e.g. Department of Petroleum Engineering Seminar"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          placeholder="Describe the event..."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="eventDate"
            className="block text-sm font-medium text-gray-700"
          >
            Date
          </label>
          <input
            id="eventDate"
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          />
        </div>

        <div>
          <label
            htmlFor="eventTime"
            className="block text-sm font-medium text-gray-700"
          >
            Time
          </label>
          <input
            id="eventTime"
            type="time"
            required
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700"
        >
          Location
        </label>
        <input
          id="location"
          type="text"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          placeholder="e.g. Main Auditorium"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
        >
          <option value="">Select a category</option>
          {EVENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="hashtags"
          className="block text-sm font-medium text-gray-700"
        >
          Hashtags
        </label>
        <input
          id="hashtags"
          type="text"
          value={hashtagsInput}
          onChange={(e) => setHashtagsInput(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-pti-green focus:outline-none focus:ring-2 focus:ring-pti-green/20"
          placeholder="e.g. seminar, engineering, nd1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Comma-separated, up to 10 tags
        </p>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700">
          Visibility
        </span>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            Public
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            Private (unlisted)
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Private events are only accessible via direct link
        </p>
      </div>

      <div>
        <label
          htmlFor="flyer"
          className="block text-sm font-medium text-gray-700"
        >
          Flyer Image (optional)
        </label>
        <p className="mt-1 text-xs text-gray-500">
          JPG, PNG, or WEBP — max 5MB
        </p>
        <input
          id="flyer"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFlyerChange}
          className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-pti-green/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-pti-green hover:file:bg-pti-green/20"
        />
        {flyerPreview && (
          <Image
            src={flyerPreview}
            alt="Flyer preview"
            width={400}
            height={300}
            unoptimized
            className="mt-3 max-h-48 rounded-lg border border-gray-200 object-contain"
          />
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-pti-green px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-pti-green-dark disabled:opacity-50 sm:w-auto"
      >
        {loading
          ? mode === "edit"
            ? "Saving..."
            : "Posting..."
          : mode === "edit"
            ? "Save Changes"
            : "Post Event"}
      </button>
    </form>
  );
}

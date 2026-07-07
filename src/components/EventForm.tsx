"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_FLYER_TYPES,
  EVENT_CATEGORIES,
  MAX_FLYER_SIZE,
  labelToCategory,
} from "@/lib/constants";

export function EventForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
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

  const suggestCategory = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Enter a title and description first.");
      return;
    }

    setSuggesting(true);
    setError("");

    try {
      const res = await fetch("/api/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not suggest category.");
        return;
      }

      setCategory(data.category);
    } catch {
      setError("Could not suggest category. Please select manually.");
    } finally {
      setSuggesting(false);
    }
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

      let flyerUrl: string | null = null;

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

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          event_date: eventDate,
          event_time: eventTime,
          location,
          category: categoryValue,
          flyer_url: flyerUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to post event.");
        setLoading(false);
        return;
      }

      router.push("/");
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
            min={new Date().toISOString().split("T")[0]}
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
        <div className="flex items-center justify-between">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <button
            type="button"
            onClick={suggestCategory}
            disabled={suggesting || !title || !description}
            className="rounded-lg bg-pti-gold px-3 py-1.5 text-xs font-medium text-pti-green transition-colors hover:bg-pti-gold/90 disabled:opacity-50"
          >
            {suggesting ? "Suggesting..." : "Suggest Category"}
          </button>
        </div>
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
        {loading ? "Posting..." : "Post Event"}
      </button>
    </form>
  );
}

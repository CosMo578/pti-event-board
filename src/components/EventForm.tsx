"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ALLOWED_FLYER_TYPES,
  EVENT_CATEGORIES,
  MAX_FLYER_SIZE,
  categoryToLabel,
  labelToCategory,
} from "@/lib/constants";
import { formatHashtagsForInput, parseHashtagsInput } from "@/lib/hashtags";
import { htmlToPlainText } from "@/lib/rich-text";
import type { Event, EventVisibility } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";

interface EventFormProps {
  mode?: "create" | "edit";
  event?: Event;
}

const fieldClassName =
  "mt-1.5 h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function EventForm({ mode = "create", event }: EventFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const flyerInputRef = useRef<HTMLInputElement>(null);

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
  const [flyerRemoved, setFlyerRemoved] = useState(false);
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
      e.target.value = "";
      return;
    }

    if (file.size > MAX_FLYER_SIZE) {
      setError("Image must be 5MB or smaller.");
      e.target.value = "";
      return;
    }

    if (flyerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(flyerPreview);
    }

    setError("");
    setFlyer(file);
    setFlyerRemoved(false);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const clearFlyer = () => {
    if (flyerPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(flyerPreview);
    }
    setFlyer(null);
    setFlyerPreview(null);
    setFlyerRemoved(true);
    if (flyerInputRef.current) {
      flyerInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const plainDescription = htmlToPlainText(description);
      if (plainDescription.length < 10) {
        setError("Description must be at least 10 characters.");
        setLoading(false);
        return;
      }
      if (description.length > 5000) {
        setError("Description is too long. Try shortening the text or formatting.");
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to create an event.");
        setLoading(false);
        return;
      }

      let flyerUrl: string | null = flyerRemoved
        ? null
        : (event?.flyer_url ?? null);

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
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="min-w-0">
        <Label htmlFor="title">Event Title</Label>
        <Input
          id="title"
          type="text"
          required
          disabled={loading}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={fieldClassName}
          placeholder="e.g. Department of Petroleum Engineering Seminar"
        />
      </div>

      <div className="min-w-0">
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          id="description"
          value={description}
          onChange={setDescription}
          placeholder="Describe the event..."
          disabled={loading}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="eventDate">Date</Label>
          <Input
            id="eventDate"
            type="date"
            required
            disabled={loading}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            min={mode === "create" ? new Date().toISOString().split("T")[0] : undefined}
            className={fieldClassName}
          />
        </div>

        <div className="min-w-0">
          <Label htmlFor="eventTime">Time</Label>
          <Input
            id="eventTime"
            type="time"
            required
            disabled={loading}
            value={eventTime}
            onChange={(e) => setEventTime(e.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="min-w-0">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          required
          disabled={loading}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={fieldClassName}
          placeholder="e.g. Main Auditorium"
        />
      </div>

      <div className="min-w-0">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          required
          disabled={loading}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={fieldClassName}
        >
          <option value="">Select a category</option>
          {EVENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-0">
        <Label htmlFor="hashtags">Hashtags</Label>
        <Input
          id="hashtags"
          type="text"
          disabled={loading}
          value={hashtagsInput}
          onChange={(e) => setHashtagsInput(e.target.value)}
          className={fieldClassName}
          placeholder="e.g. seminar, engineering, nd1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Comma-separated, up to 10 tags
        </p>
      </div>

      <div className="min-w-0">
        <span className="block text-sm font-medium">Visibility</span>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              disabled={loading}
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
              disabled={loading}
              onChange={() => setVisibility("private")}
            />
            Private (unlisted)
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Private events are only accessible via direct link
        </p>
      </div>

      <div className="min-w-0">
        <Label htmlFor="flyer">Flyer Image (optional)</Label>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, or WEBP — max 5MB
        </p>
        <Input
          ref={flyerInputRef}
          id="flyer"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={handleFlyerChange}
          className="mt-2 h-auto w-full min-w-0 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-pti-green/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-pti-green hover:file:bg-pti-green/20"
        />
        {flyerPreview && (
          <div className="relative mt-3 max-w-full">
            <Image
              src={flyerPreview}
              alt="Flyer preview"
              width={400}
              height={300}
              unoptimized
              className="max-h-48 w-full max-w-full rounded-lg border border-border object-contain"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading}
              onClick={clearFlyer}
              className="absolute top-2 right-2 gap-1 shadow-sm"
            >
              <X className="size-3.5" />
              Remove
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="h-11 w-full bg-pti-green px-6 text-white hover:bg-pti-green-dark sm:w-auto"
      >
        {loading
          ? mode === "edit"
            ? "Saving..."
            : "Creating..."
          : mode === "edit"
            ? "Save Changes"
            : "Create Event"}
      </Button>
    </form>
  );
}

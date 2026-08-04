import { z } from "zod";
import { EVENT_CATEGORY_VALUES } from "@/lib/constants";
import { getEventStartPastError } from "@/lib/event-query";
import { htmlToPlainText } from "@/lib/rich-text";
import { sanitizeDescriptionHtml } from "@/lib/sanitize-description";

const DESCRIPTION_MIN_PLAIN = 10;
const DESCRIPTION_MAX_HTML = 5000;
const MAX_ATTENDEES_CAP = 10000;

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

function padTime(timeStr: string): string {
  return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
}

function toEventDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${padTime(timeStr)}`);
}

/** Empty string / undefined → null for optional nullable fields from forms. */
function emptyToNull(value: unknown): unknown {
  if (value === "" || value === undefined) return null;
  return value;
}

export const descriptionSchema = z
  .string()
  .max(DESCRIPTION_MAX_HTML, "Description is too long")
  .transform((value) => sanitizeDescriptionHtml(value))
  .refine(
    (html) => htmlToPlainText(html).length >= DESCRIPTION_MIN_PLAIN,
    {
      message: `Description must be at least ${DESCRIPTION_MIN_PLAIN} characters`,
    },
  );

const maxAttendeesSchema = z.preprocess(
  emptyToNull,
  z
    .number({ error: "Max attendees must be a number" })
    .int("Max attendees must be a whole number")
    .min(1, "Max attendees must be at least 1")
    .max(MAX_ATTENDEES_CAP, `Max attendees cannot exceed ${MAX_ATTENDEES_CAP}`)
    .nullable(),
);

const endDateSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(dateRegex, "End date must be YYYY-MM-DD")
    .nullable(),
);

const endTimeSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(timeRegex, "End time must be HH:MM or HH:MM:SS")
    .nullable(),
);

const eventFieldsBase = {
  title: z.string().min(3).max(200),
  description: descriptionSchema,
  event_date: z.string().regex(dateRegex),
  event_time: z.string().regex(timeRegex),
  location: z.string().min(2).max(300),
  category: z.enum(EVENT_CATEGORY_VALUES),
  flyer_url: z.string().url().optional().nullable(),
  visibility: z.enum(["public", "private"]).default("public"),
  hashtags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
  max_attendees: maxAttendeesSchema,
  end_date: endDateSchema,
  end_time: endTimeSchema,
};

function refineStartNotInPast(
  data: { event_date?: string; event_time?: string },
  ctx: z.RefinementCtx,
) {
  if (!data.event_date || !data.event_time) return;

  const startError = getEventStartPastError(data.event_date, data.event_time);
  if (startError) {
    const path =
      startError.includes("time") ? (["event_time"] as const) : (["event_date"] as const);
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: startError,
      path: [...path],
    });
  }
}

function refineEndDateTime(
  data: {
    event_date?: string;
    event_time?: string;
    end_date?: string | null;
    end_time?: string | null;
  },
  ctx: z.RefinementCtx,
) {
  const hasEndDate = data.end_date != null;
  const hasEndTime = data.end_time != null;

  if (hasEndDate !== hasEndTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Both end date and end time are required when setting an end",
      path: hasEndDate ? ["end_time"] : ["end_date"],
    });
    return;
  }

  if (
    hasEndDate &&
    hasEndTime &&
    data.event_date &&
    data.event_time &&
    data.end_date &&
    data.end_time
  ) {
    const start = toEventDateTime(data.event_date, data.event_time);
    const end = toEventDateTime(data.end_date, data.end_time);
    if (!(end.getTime() > start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date/time must be after the start date/time",
        path: ["end_date"],
      });
    }
  }
}

export const createEventSchema = z
  .object({
    ...eventFieldsBase,
    max_attendees: maxAttendeesSchema.optional().default(null),
    end_date: endDateSchema.optional().default(null),
    end_time: endTimeSchema.optional().default(null),
  })
  .superRefine((data, ctx) => {
    refineStartNotInPast(data, ctx);
    refineEndDateTime(data, ctx);
  });

/** Partial update — omitted capacity/end fields are left unchanged by the API. */
export const updateEventSchema = z
  .object(eventFieldsBase)
  .partial()
  .superRefine((data, ctx) => {
    if (!("end_date" in data) && !("end_time" in data)) return;

    const hasEndDate = data.end_date != null;
    const hasEndTime = data.end_time != null;

    if (hasEndDate !== hasEndTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both end date and end time are required when setting an end",
        path: hasEndDate ? ["end_time"] : ["end_date"],
      });
    }
  });

/** Validate merged event fields after PATCH (start not past + end consistency). */
export function validateEventSchedule(
  fields: {
    event_date: string;
    event_time: string;
    end_date: string | null;
    end_time: string | null;
  },
  options?: {
    /** When set, an unchanged start may remain in the past (same-day in-progress edits). */
    allowUnchangedPastStart?: { event_date: string; event_time: string };
  },
): string | null {
  const startError = getEventStartPastError(fields.event_date, fields.event_time);
  if (startError) {
    const prior = options?.allowUnchangedPastStart;
    const unchanged =
      prior != null &&
      fields.event_date === prior.event_date &&
      fields.event_time.slice(0, 5) === prior.event_time.slice(0, 5);
    if (!unchanged) return startError;
  }

  const hasEndDate = fields.end_date != null;
  const hasEndTime = fields.end_time != null;

  if (hasEndDate !== hasEndTime) {
    return "Both end date and end time are required when setting an end";
  }

  if (hasEndDate && hasEndTime && fields.end_date && fields.end_time) {
    const start = toEventDateTime(fields.event_date, fields.event_time);
    const end = toEventDateTime(fields.end_date, fields.end_time);
    if (!(end.getTime() > start.getTime())) {
      return "End date/time must be after the start date/time";
    }
  }

  return null;
}

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const notificationPreferencesSchema = z.object({
  push_enabled: z.boolean().optional(),
});

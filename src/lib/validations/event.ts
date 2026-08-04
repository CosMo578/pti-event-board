import { z } from "zod";
import { EVENT_CATEGORY_VALUES } from "@/lib/constants";
import { htmlToPlainText } from "@/lib/rich-text";
import { sanitizeDescriptionHtml } from "@/lib/sanitize-description";

const DESCRIPTION_MIN_PLAIN = 10;
const DESCRIPTION_MAX_HTML = 5000;

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

const eventFields = {
  title: z.string().min(3).max(200),
  description: descriptionSchema,
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  location: z.string().min(2).max(300),
  category: z.enum(EVENT_CATEGORY_VALUES),
  flyer_url: z.string().url().optional().nullable(),
  visibility: z.enum(["public", "private"]).default("public"),
  hashtags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
};

export const createEventSchema = z.object(eventFields);

export const updateEventSchema = createEventSchema.partial();

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

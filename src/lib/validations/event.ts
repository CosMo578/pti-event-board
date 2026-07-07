import { z } from "zod";
import { EVENT_CATEGORY_VALUES } from "@/lib/constants";

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  location: z.string().min(2).max(300),
  category: z.enum(EVENT_CATEGORY_VALUES),
  flyer_url: z.string().url().optional().nullable(),
});

export const subscribeSchema = z.object({
  email: z.string().email().max(255),
});

export const suggestCategorySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
});

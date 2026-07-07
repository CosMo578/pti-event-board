export const EVENT_CATEGORIES = [
  "Academic",
  "Social",
  "Sports",
  "Religious",
  "Departmental",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_VALUES = [
  "academic",
  "social",
  "sports",
  "religious",
  "departmental",
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number];

export const MAX_FLYER_SIZE = 5 * 1024 * 1024;
export const ALLOWED_FLYER_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const CATEGORY_COLORS: Record<EventCategoryValue, string> = {
  academic: "bg-blue-100 text-blue-800",
  social: "bg-purple-100 text-purple-800",
  sports: "bg-green-100 text-green-800",
  religious: "bg-amber-100 text-amber-800",
  departmental: "bg-rose-100 text-rose-800",
};

export function categoryToLabel(value: EventCategoryValue): EventCategory {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as EventCategory;
}

export function labelToCategory(label: string): EventCategoryValue | null {
  const normalized = label.toLowerCase();
  if (EVENT_CATEGORY_VALUES.includes(normalized as EventCategoryValue)) {
    return normalized as EventCategoryValue;
  }
  return null;
}

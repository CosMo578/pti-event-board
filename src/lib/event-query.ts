/** Escape % and _ for safe PostgREST ilike patterns. */
export function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** Normalize a search term into an optional hashtag slug (no leading #). */
export function normalizeHashtagQuery(value: string): string | null {
  const trimmed = value.trim().replace(/^#+/, "").toLowerCase();
  if (!trimmed || !/^[a-z0-9_-]+$/i.test(trimmed)) return null;
  return trimmed;
}

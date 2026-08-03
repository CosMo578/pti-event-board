const MAX_HASHTAGS = 10;

export function parseHashtagsInput(input: string): string[] {
  const tags = input
    .split(/[,\s]+/)
    .map((tag) => tag.replace(/^#/, "").trim().toLowerCase())
    .filter((tag) => tag.length > 0 && tag.length <= 30);

  return [...new Set(tags)].slice(0, MAX_HASHTAGS);
}

export function formatHashtagsForInput(hashtags: string[] | null | undefined): string {
  if (!hashtags?.length) return "";
  return hashtags.join(", ");
}

import DOMPurify from "isomorphic-dompurify";

/** Tags TipTap emits for bold/italic/lists/paragraphs. */
const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"];

/** Server-side / isomorphic HTML sanitization before persist or render. */
export function sanitizeDescriptionHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: [],
  });
}

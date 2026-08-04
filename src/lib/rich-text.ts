const RICH_TEXT_TAG_RE = /<\/?(?:p|br|strong|b|em|i|ul|ol|li)\b/i;

export function isRichTextHtml(value: string): boolean {
  return RICH_TEXT_TAG_RE.test(value);
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Strip markup for cards, calendar exports, and length checks. */
export function htmlToPlainText(value: string): string {
  if (!value) return "";
  if (!isRichTextHtml(value)) return value;

  const plain = value
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/?(?:ul|ol)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n");

  return decodeBasicEntities(plain).trim();
}

/**
 * Convert legacy plain-text descriptions into TipTap-compatible HTML.
 * Existing HTML is passed through; TipTap's schema and server sanitize on save.
 */
export function plainTextToHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  if (isRichTextHtml(text)) return text;

  return text
    .split(/\n{2,}/)
    .map((paragraph) => {
      const withBreaks = escapeHtml(paragraph).replace(/\n/g, "<br>");
      return `<p>${withBreaks || "<br>"}</p>`;
    })
    .join("");
}

export function isDescriptionEmpty(html: string): boolean {
  return htmlToPlainText(html).length === 0;
}

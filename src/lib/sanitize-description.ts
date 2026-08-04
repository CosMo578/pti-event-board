/** Tags TipTap emits for bold/italic/lists/paragraphs. */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "ul",
  "ol",
  "li",
]);

const VOID_TAGS = new Set(["br"]);

/**
 * Elements whose inner content must be discarded (not merely unwrapped).
 * Unwrapping `<script>` would leave executable-looking text; dropping is safer.
 */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "noscript",
  "template",
  "svg",
  "math",
]);

const DROP_WITH_CONTENT_RE = new RegExp(
  `<(${[...DROP_WITH_CONTENT].join("|")})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`,
  "gi",
);

const DROP_SELF_RE = new RegExp(
  `<(${[...DROP_WITH_CONTENT].join("|")})\\b[^>]*\\/?>`,
  "gi",
);

const TAG_RE = /<\/?([a-zA-Z][\w:-]*)\b[^>]*>/g;

function stripOnce(html: string): string {
  let out = html.replace(DROP_WITH_CONTENT_RE, "").replace(DROP_SELF_RE, "");

  out = out.replace(TAG_RE, (match, rawName: string) => {
    const name = rawName.toLowerCase();
    const isClose = match.startsWith("</");

    if (!ALLOWED_TAGS.has(name)) {
      return "";
    }

    if (VOID_TAGS.has(name)) {
      return isClose ? "" : "<br>";
    }

    return isClose ? `</${name}>` : `<${name}>`;
  });

  return out;
}

/**
 * Allowlist HTML sanitization before persist or render.
 *
 * Pure string/regex implementation — no jsdom / isomorphic-dompurify — so
 * Next.js production SSR does not pull ESM-incompatible jsdom into the
 * server graph. Only ALLOWED_TAGS are emitted, and never with attributes.
 */
export function sanitizeDescriptionHtml(dirty: string): string {
  if (!dirty) return "";

  let html = dirty.replace(/\u0000/g, "").replace(/<!--[\s\S]*?-->/g, "");

  // Iterate to defeat nested obfuscation (e.g. <scr<script>ipt>).
  for (let i = 0; i < 10; i++) {
    const prev = html;
    html = stripOnce(html);
    if (html === prev) break;
  }

  return html;
}

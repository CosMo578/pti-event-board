import { cn } from "@/lib/utils";
import { isRichTextHtml } from "@/lib/rich-text";
import { sanitizeDescriptionHtml } from "@/lib/sanitize-description";

interface RichTextContentProps {
  content: string;
  className?: string;
}

/**
 * Renders event descriptions safely.
 * Legacy plain text keeps whitespace-pre-wrap; HTML is sanitized first.
 */
export function RichTextContent({ content, className }: RichTextContentProps) {
  if (!isRichTextHtml(content)) {
    return (
      <div
        className={cn(
          "rich-text whitespace-pre-wrap break-words text-foreground/90",
          className,
        )}
      >
        {content}
      </div>
    );
  }

  const html = sanitizeDescriptionHtml(content);

  return (
    <div
      className={cn("rich-text break-words text-foreground/90", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

import 'server-only';
import sanitizeHtml from 'sanitize-html';

/**
 * Whitelist matching what components/admin/RichTextEditor.tsx can produce.
 * Server Actions accept any POST, so editor output is never trusted as-is.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 's', 'u', 'ul', 'ol', 'li', 'blockquote', 'a'],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow' }),
    },
  }).trim();
}

import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "blockquote",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "img",
  "br",
  "figure",
  "figcaption"
];

// Runs on the server before an article's body is ever sent to the browser.
// Contributor accounts are trusted more than an anonymous public form, but
// this is still user-authored HTML rendered on a public page — so it's
// sanitized down to a plain editorial tag set (no <script>, no event
// handlers, no iframes) rather than trusted as-is.
export function sanitizeArticleHtml(html: string): string {
  return DOMPurify.sanitize(html || "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"]
  });
}

const ALLOWED_TAGS = new Set([
  "p",
  "div",
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
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "title"]
};

// Runs on the server before a post's content is ever sent to the browser.
// Contributor accounts are trusted more than an anonymous public form, but
// this is still user-authored HTML rendered on a public page, so it's
// stripped down to a plain editorial tag set rather than trusted as-is.
//
// This is a small regex-based allowlist rather than a library like
// isomorphic-dompurify — that package pulls in jsdom, which has known
// compatibility problems in some serverless/edge runtimes and can crash
// every request that touches it. For content that already comes from
// authenticated contributors (not anonymous public input), a careful
// tag/attribute allowlist is a reasonable, dependency-free trade-off.
export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";

  // Strip script/style blocks entirely, including their content.
  let output = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");

  // Strip any remaining tag not on the allowlist, but keep its inner text.
  // Also strips disallowed attributes and neutralizes javascript: URLs.
  output = output.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTag, rawAttrs) => {
    const tag = String(rawTag).toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) return "";

    if (isClosing) return `</${tag}>`;

    const allowedAttrNames = ALLOWED_ATTRS[tag] || [];
    if (allowedAttrNames.length === 0) return `<${tag}>`;

    const attrPattern = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
    const keptAttrs: string[] = [];
    let attrMatch: RegExpExecArray | null;
    while ((attrMatch = attrPattern.exec(rawAttrs)) !== null) {
      const name = (attrMatch[1] || attrMatch[3] || "").toLowerCase();
      const value = attrMatch[2] ?? attrMatch[4] ?? "";
      if (!allowedAttrNames.includes(name)) continue;
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(value)) continue;
      const safeValue = value.replace(/"/g, "&quot;");
      keptAttrs.push(`${name}="${safeValue}"`);
    }

    return keptAttrs.length > 0 ? `<${tag} ${keptAttrs.join(" ")}>` : `<${tag}>`;
  });

  return output;
}

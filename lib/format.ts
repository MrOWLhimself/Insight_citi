export function readTimeMinutes(body: string, wordsPerMinute = 220): number {
  const plainText = body.replace(/<[^>]*>/g, " ");
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function siteUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://insight.citiplug.com";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

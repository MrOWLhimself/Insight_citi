import type { MetadataRoute } from "next";
import { getAllPublishedSlugs, getAllCategories } from "@/lib/queries";
import { siteUrl } from "@/lib/format";

// Regenerated on-demand (subject to the route's revalidate window), so a
// newly published article or category shows up here without a manual edit.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, categories] = await Promise.all([getAllPublishedSlugs(), getAllCategories()]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: siteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0
    }
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: siteUrl(`/topics/${category.slug}`),
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.7
  }));

  const articleEntries: MetadataRoute.Sitemap = slugs.map(({ slug, updated_at }) => ({
    url: siteUrl(`/${slug}`),
    lastModified: new Date(updated_at),
    changeFrequency: "weekly",
    priority: 0.8
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}

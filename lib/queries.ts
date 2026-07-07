import { supabaseServer } from "@/lib/supabase/server";
import type { Article, Category, AdSlot } from "@/lib/types";

const ARTICLE_SELECT = "*,categories(name,slug),profiles(full_name)";

export async function getPublishedArticles(limit = 12): Promise<Article[]> {
  const { data, error } = await supabaseServer
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublishedArticles error:", error.message);
    return [];
  }
  return (data as unknown as Article[]) ?? [];
}

export async function getFeaturedArticles(limit = 4): Promise<Article[]> {
  const { data, error } = await supabaseServer
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedArticles error:", error.message);
    return [];
  }
  return (data as unknown as Article[]) ?? [];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabaseServer
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getArticleBySlug error:", error.message);
    return null;
  }
  return (data as unknown as Article) ?? null;
}

export async function getArticlesByCategory(categorySlug: string, limit = 24): Promise<Article[]> {
  // The `!inner` hint is required for PostgREST to actually filter rows by
  // an embedded resource's column (categories.slug) rather than just
  // attaching it — without it, the eq() below would be silently ignored.
  const { data, error } = await supabaseServer
    .from("articles")
    .select("*,categories!inner(name,slug),profiles(full_name)")
    .eq("status", "published")
    .eq("categories.slug", categorySlug)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getArticlesByCategory error:", error.message);
    return [];
  }
  return (data as unknown as Article[]) ?? [];
}

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabaseServer
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("getAllCategories error:", error.message);
    return [];
  }
  return (data as Category[]) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabaseServer
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getCategoryBySlug error:", error.message);
    return null;
  }
  return (data as Category) ?? null;
}

export async function getActiveAds(): Promise<AdSlot[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseServer
    .from("ad_slots")
    .select("*")
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("slot_key", { ascending: true });

  if (error) {
    console.error("getActiveAds error:", error.message);
    return [];
  }
  return (data as AdSlot[]) ?? [];
}

// Every slug that should exist as a real, published, indexable page.
// Used by generateStaticParams and the sitemap so the two never drift apart.
export async function getAllPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const { data, error } = await supabaseServer
    .from("articles")
    .select("slug, updated_at")
    .eq("status", "published");

  if (error) {
    console.error("getAllPublishedSlugs error:", error.message);
    return [];
  }
  return (data as { slug: string; updated_at: string }[]) ?? [];
}

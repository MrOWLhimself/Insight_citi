import { supabaseServer } from "@/lib/supabase/server";
import type { Post, Category, AdSlot } from "@/lib/types";

const POST_SELECT = "*,profiles!author_id(full_name)";

// insight_posts.category is a uuid FK, but we don't rely on PostgREST's
// embedded-join syntax for it (unconfirmed whether a real FK constraint
// backs that column, and getting that wrong silently drops the filter).
// Categories are fetched once and matched in JS instead — cheap, since
// there are only ~30 of them, and impossible to get subtly wrong.
export async function getCategoryMap(): Promise<Map<string, Category>> {
  const categories = await getAllCategories();
  return new Map(categories.map((category) => [category.id, category]));
}

export function resolveCategoryName(post: Post, categoryMap: Map<string, Category>): string {
  if (post.category) {
    const match = categoryMap.get(post.category);
    if (match) return match.name;
  }
  if (post.categories && post.categories.length > 0) return post.categories[0];
  return "Insight";
}

export function resolveCoverImage(post: Post): string | null {
  return post.cover_image_url || post.cover_image || null;
}

export async function getPublishedPosts(limit = 16): Promise<Post[]> {
  const { data, error } = await supabaseServer
    .from("insight_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .or("visibility.is.null,visibility.eq.public")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPublishedPosts error:", error.message);
    return [];
  }
  return (data as unknown as Post[]) ?? [];
}

export async function getFeaturedPosts(limit = 4): Promise<Post[]> {
  const { data, error } = await supabaseServer
    .from("insight_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .eq("is_featured", true)
    .or("visibility.is.null,visibility.eq.public")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedPosts error:", error.message);
    return [];
  }
  return (data as unknown as Post[]) ?? [];
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabaseServer
    .from("insight_posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getPostBySlug error:", error.message);
    return null;
  }
  return (data as unknown as Post) ?? null;
}

export async function getPostsByCategorySlug(categorySlug: string, limit = 24): Promise<Post[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];

  const { data, error } = await supabaseServer
    .from("insight_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .or("visibility.is.null,visibility.eq.public")
    .eq("category", category.id)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getPostsByCategorySlug error:", error.message);
    return [];
  }

  const byCategoryId = (data as unknown as Post[]) ?? [];
  if (byCategoryId.length > 0) return byCategoryId;

  // Fallback for older posts that only ever got tagged through the
  // legacy `categories` text[] column and never got a real `category` uuid set.
  const { data: fallbackData, error: fallbackError } = await supabaseServer
    .from("insight_posts")
    .select(POST_SELECT)
    .eq("status", "published")
    .or("visibility.is.null,visibility.eq.public")
    .contains("categories", [category.name])
    .order("published_at", { ascending: false })
    .limit(limit);

  if (fallbackError) {
    console.error("getPostsByCategorySlug fallback error:", fallbackError.message);
    return [];
  }
  return (fallbackData as unknown as Post[]) ?? [];
}

export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabaseServer
    .from("insight_categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getAllCategories error:", error.message);
    return [];
  }
  return (data as Category[]) ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabaseServer
    .from("insight_categories")
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
    .from("insight_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .or("visibility.is.null,visibility.eq.public");

  if (error) {
    console.error("getAllPublishedSlugs error:", error.message);
    return [];
  }
  return (data as { slug: string; updated_at: string }[]) ?? [];
}

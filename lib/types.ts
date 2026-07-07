export type PostStatus = "draft" | "review" | "published" | "rejected" | "archived";
export type PostVisibility = "public" | "private";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "contributor" | "editor" | "admin";
}

// Matches the real, already-live `insight_posts` table — not a fresh
// schema. `content` is jsonb but holds a plain HTML string. `category` is
// the real FK (uuid); `categories` (text[]) and the `cover_image` /
// `insight_posts.category` columns are legacy leftovers from earlier
// sessions and are read as fallbacks only, never written to.
export interface Post {
  id: string;
  author_id: string;
  category: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image?: string | null;
  status: PostStatus;
  visibility: PostVisibility;
  is_featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: string[] | null;
  profiles?: Pick<Profile, "full_name"> | null;
}


export interface AdSlot {
  id: string;
  slot_key: string;
  label: string | null;
  headline: string | null;
  body: string | null;
  image_url: string | null;
  target_url: string | null;
  sponsor_name: string | null;
  ad_mode: "manual" | "automatic";
  network_code: string | null;
  active: boolean;
}

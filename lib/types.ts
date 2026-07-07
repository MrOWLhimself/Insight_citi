export type ArticleStatus = "draft" | "review" | "published" | "rejected" | "archived";
export type ArticleTemplate = "classic" | "cover" | "split" | "analysis" | "essay" | "visual";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "contributor" | "editor" | "admin";
}

export interface Article {
  id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  cover_image_url: string | null;
  template: ArticleTemplate;
  status: ArticleStatus;
  featured: boolean;
  premium: boolean;
  seo_title: string | null;
  seo_description: string | null;
  read_time?: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "name" | "slug"> | null;
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

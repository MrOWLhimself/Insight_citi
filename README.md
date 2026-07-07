# Insight by CitiPlug — Next.js rebuild

This is the Next.js (App Router) rebuild of Insight, reading and writing the
**real, already-live** Supabase tables for this project — `insight_posts`,
`insight_categories`, and the `place-images` storage bucket — not a separate
schema. An earlier pass of this rebuild assumed a fresh `articles`/`categories`
schema that turned out not to match what's actually in the database; this
version was corrected against the real table structure.

The rebuild exists to fix one thing a client-rendered site can't: every
article and category page renders its real title, description, Open Graph
tags, and `NewsArticle` JSON-LD **on the server**, before the HTML reaches
the browser — so search crawlers and social link-preview bots (WhatsApp, X,
LinkedIn, Slack) see the real content immediately instead of a generic
placeholder.

## What's included

- **`/`** — homepage, server-rendered from real published posts in `insight_posts` (revalidates every 5 min)
- **`/[slug]`** — post pages with `generateMetadata` (per-post title, description, canonical, OG/Twitter tags) and `NewsArticle` JSON-LD. Pre-rendered for every published slug at build time (`generateStaticParams`), with on-demand rendering + caching for anything published afterward.
- **`/topics/[category]`** — category pages, server-rendered from real `insight_categories` + matching posts, with `CollectionPage` JSON-LD
- **`/sitemap.xml`** — generated from the live tables, so publishing a new post adds it automatically
- **`/robots.txt`** — allows everything except `/dashboard` and `/admin`
- **`/dashboard`** — contributor CMS: sign up/in (show/hide password toggle, clear error states), write/edit/delete drafts, submit for review, upload a cover image by drag-and-drop or file picker, and write the post body in a rich text editor (bold/italic/headings/quotes/lists/links/inline images)
- **`/admin`** — editor/admin panel (publish, send to review, reject, feature, manage ad campaigns) — client-rendered, `noindex`, gated by Postgres RLS via the real `is_admin()` function (not just a UI check). Distinguishes "wrong password" from "signed in but not an editor/admin" so people aren't stuck looking at a login form that won't accept a perfectly correct password.

## The real schema this app uses

- **`insight_posts`** — the real posts table. Key columns: `title`, `slug`, `excerpt`, `content` (jsonb holding an HTML string), `cover_image_url` (falls back to the legacy `cover_image` column if unset), `category` (uuid FK — legacy `categories` text[] is used as a fallback if `category` is unset), `status` (`draft`/`review`/`published`/`rejected`/`archived`), `visibility` (`public`/`private`), `is_featured`, `seo_title`, `seo_description`, `canonical_url`.
- **`insight_categories`** — `name`, `slug`, `description`, `is_active`, `sort_order`.
- **`profiles`** — unchanged, already correct (`role` is `contributor`/`editor`/`admin`).
- **`ad_slots`** — homepage/article/category ad placeholders (manual or automatic/programmatic mode).
- **Storage**: `place-images` (public bucket) for cover + inline images. `inkwell-images` also exists in this project for a separate system and isn't used here.

There is **no `template` column** on `insight_posts` — the multi-template article layout system (cover/split/analysis/essay) from an earlier draft of this rebuild was based on a column that doesn't exist in the real schema and has been removed. All posts use one consistent article layout.

### Cover images and in-story images

Both the cover image field and the rich text editor's image button upload directly to the real `place-images` Supabase Storage bucket, under `insight/<user_id>/covers/...` or `insight/<user_id>/inline/...` — no more pasting an image URL from somewhere else. `supabase-schema.sql` includes a fix for a real pre-existing gap on that bucket: the old policies let *any* user delete or overwrite *any* image in it; the fix scopes update/delete to the uploader (matching the pattern already used on `inkwell-images`).

### Post body format

Older posts saved as plain text (paragraphs separated by a blank line) still render correctly — the post page detects whether the content contains HTML and falls back to paragraph-split rendering if not. New posts written in the rich text editor save as sanitized HTML (via `isomorphic-dompurify`, stripped to a plain editorial tag set — no scripts, no embeds) and render directly.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase anon key for `uysipsegizbixwgvwdzl.supabase.co`
3. Run `supabase-schema.sql` once in the SQL editor — it only touches `ad_slots` and the `place-images` storage policies (both idempotent, safe to run more than once). It does **not** create `insight_posts`/`insight_categories` — those already exist.
4. `npm run dev` to run locally at `http://localhost:3000`

## Deploying

Built for Vercel:

1. Push this folder to a GitHub repo
2. Import it in Vercel
3. Add the same three environment variables from `.env.local` in Vercel's project settings
4. Set `NEXT_PUBLIC_SITE_URL` to your real production domain (`https://insight.citiplug.com`)
5. Deploy

To promote an account to admin/editor:

```sql
update public.profiles set role = 'admin' where id = '<USER_UUID>';
```

## What's still worth doing next

- **Real full-text search** — a Postgres `tsvector` index on `insight_posts.title`/`content`/`excerpt`, queried through Supabase, to replace any client-side text matching
- **Resolve the duplicate columns** (`cover_image_url` vs `cover_image`, `category` vs `categories` text[]) properly with a one-time data migration, rather than the app reading both as fallbacks indefinitely
- **Category page pagination** once a category has more than a page's worth of posts

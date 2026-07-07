# Insight by CitiPlug — Next.js rebuild

This is the Next.js (App Router) rebuild of the Insight prototype, using the
same Supabase project and schema. The rebuild exists to fix one thing the
static Hostinger version couldn't: every article and category page now
renders its real title, description, Open Graph tags, and `NewsArticle`
JSON-LD **on the server**, before the HTML reaches the browser — so search
crawlers and social link-preview bots (WhatsApp, X, LinkedIn, Slack) see the
real content immediately instead of a generic placeholder.

## What's included

- **`/`** — homepage, server-rendered from real published articles (revalidates every 5 min)
- **`/[slug]`** — article pages with `generateMetadata` (per-article title, description, canonical, OG/Twitter tags) and `NewsArticle` JSON-LD. Pre-rendered for every published slug at build time (`generateStaticParams`), with on-demand rendering + caching for anything published afterward.
- **`/topics/[category]`** — category pages, also server-rendered from real data, with `CollectionPage` JSON-LD
- **`/sitemap.xml`** — generated from the live `articles` and `categories` tables, so publishing a new story adds it automatically
- **`/robots.txt`** — allows everything except `/dashboard` and `/admin`
- **`/dashboard`** — contributor CMS: sign up/in (with a show/hide password toggle and clear error states), write/edit/delete drafts, submit for review, upload a cover image by drag-and-drop or file picker, and write the story body in a rich text editor (bold/italic/headings/quotes/lists/links/inline images)
- **`/admin`** — editor/admin panel (publish, send to review, reject, feature, manage ad campaigns) — client-rendered, `noindex`, gated by Postgres RLS (not just a UI check). Distinguishes "wrong password" from "signed in but not an editor/admin" so people aren't stuck looking at a login form that won't accept a perfectly correct password.

### Cover images and in-story images

Both the cover image field and the rich text editor's image button upload directly to a Supabase Storage bucket called `media` — no more pasting an image URL from somewhere else. Files are stored under `media/<user_id>/covers/...` or `media/<user_id>/inline/...`, and are publicly readable once uploaded (needed since articles are public), but only the uploading user can add, replace, or delete their own files — enforced by Postgres RLS on `storage.objects`, the same pattern used for the `articles` table.

**If you're pointing this at your existing Supabase project** (`uysipsegizbixwgvwdzl.supabase.co`), you need to run the new "Storage" section at the bottom of `supabase-schema.sql` once in the SQL editor — it's additive (creates the bucket + policies) and won't touch your existing articles/categories/ad data.

### Article body format

Older drafts saved as plain text (paragraphs separated by a blank line) still render correctly — the article page detects whether a story's body contains HTML and falls back to the old paragraph-split rendering if not. New stories written in the rich text editor save as sanitized HTML (via `isomorphic-dompurify`, stripped down to a plain editorial tag set — no scripts, no embeds) and render directly.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase anon key (same project as before: `uysipsegizbixwgvwdzl.supabase.co`)
3. If this is a fresh Supabase project, run `supabase-schema.sql` once in the SQL editor. If you're pointing at the existing project, you don't need to re-run it — nothing here changes the schema.
4. `npm run dev` to run locally at `http://localhost:3000`

## Deploying

This is built for Vercel:

1. Push this folder to a GitHub repo
2. Import it in Vercel
3. Add the same three environment variables from `.env.local` in Vercel's project settings
4. Set `NEXT_PUBLIC_SITE_URL` to your real production domain (`https://insight.citiplug.com`)
5. Deploy

After your first account signs up through `/dashboard`, promote it to admin the same way as before:

```sql
update public.profiles set role = 'admin' where id = '<USER_UUID>';
```

## What's carried over as-is

- The full visual design (`app/globals.css` is the merged, ported CSS from the static prototype — same fonts, same layout classes)
- The Supabase schema and RLS policies, unchanged
- The ad slot system (manual + automatic/programmatic modes)
- The contributor draft → review → published → rejected workflow

## What's still worth doing next

- **Real full-text search** — a Postgres `tsvector` index on `articles.title`/`body`/`excerpt`, queried through Supabase, to replace any client-side text matching
- **Category page article counts / pagination** once you have more than a page's worth of stories per category
- **Image optimization** — cover images are already served through `next/image`; consider Supabase Storage + a CDN transform if you're hosting a lot of full-resolution images

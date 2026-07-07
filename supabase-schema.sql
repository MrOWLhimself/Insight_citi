-- Insight by CitiPlug — database reference
-- Project: uysipsegizbixwgvwdzl.supabase.co
--
-- IMPORTANT: this file does NOT create `articles`, `categories`, or
-- `profiles` tables. An earlier version of this project incorrectly
-- assumed a fresh schema under those names — but this Supabase project
-- already has a live, populated content system under different names:
--   - insight_posts        (articles — has real published content)
--   - insight_categories   (categories)
--   - profiles             (already exists, already correct)
--   - place-images         (storage bucket for cover + inline images)
-- The Next.js app in this repo reads and writes those real tables
-- directly. Nothing here needs to run against a fresh project unless
-- you are intentionally starting a brand-new Supabase project from
-- scratch, in which case you'd need full CREATE TABLE statements for
-- insight_posts/insight_categories that aren't included here — ask
-- Claude to generate them from the real column list if you need that.
--
-- What IS safe and useful to run from this file on the existing project:
-- the `ad_slots` section below, and the `place-images` ownership fix.
-- Both are idempotent (safe to run more than once).

create extension if not exists pgcrypto;

-- ─── ad_slots: homepage/article/category ad campaign placeholders ──────────
create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  slot_key text not null unique,
  label text,
  headline text,
  body text,
  image_url text,
  target_url text,
  sponsor_name text,
  ad_mode text not null default 'manual' check (ad_mode in ('manual', 'automatic')),
  network_code text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ad_slots_set_updated_at on public.ad_slots;
create trigger ad_slots_set_updated_at before update on public.ad_slots
for each row execute function public.set_updated_at();

alter table public.ad_slots enable row level security;

drop policy if exists "ads public read" on public.ad_slots;
create policy "ads public read" on public.ad_slots for select
using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

-- Uses the real is_admin() function already defined in this project
-- (not a second, invented admin-check function).
drop policy if exists "ads admin manage" on public.ad_slots;
create policy "ads admin manage" on public.ad_slots for all
using (is_admin()) with check (is_admin());

insert into public.ad_slots (slot_key, label, headline, target_url, sponsor_name) values
  ('home_leaderboard_1', 'Homepage leaderboard', 'Reach readers who shape what happens next.', '#advertise', 'Insight Ads'),
  ('home_auto_top', 'Homepage automatic top', 'Programmatic-ready premium inventory.', '#advertise', 'Insight Ads'),
  ('home_top_right', 'Top stories rectangle', 'Your brand, in good company.', '#advertise', 'Insight Ads'),
  ('home_billboard_1', 'Homepage billboard', 'Ideas move people. Put your brand beside the right ones.', '#advertise', 'Insight Ads'),
  ('home_auto_mid', 'Homepage automatic mid', 'Auto-filled sponsor space for high-traffic sections.', '#advertise', 'Insight Ads'),
  ('article_top', 'Article top banner', 'Intelligent brands meet intelligent readers.', '#advertise', 'Insight Ads'),
  ('article_sidebar', 'Article sidebar rectangle 1', 'Place your story here.', '#advertise', 'Insight Ads'),
  ('article_sidebar_2', 'Article sidebar rectangle 2', 'Programmatic-ready premium inventory.', '#advertise', 'Insight Ads'),
  ('article_sidebar_3', 'Article sidebar rectangle 3', 'Reach readers who shape what happens next.', '#advertise', 'Insight Ads'),
  ('category_top', 'Category top automatic', 'Category sponsorship inventory.', '#advertise', 'Insight Ads'),
  ('category_mid', 'Category mid manual', 'Own this category placement.', '#advertise', 'Insight Ads')
on conflict (slot_key) do nothing;

-- ─── place-images: fix a real, pre-existing security gap ───────────────────
-- Before this ran, ANY user could delete or overwrite ANY image in this
-- bucket (no ownership check on the old policies). This scopes update/delete
-- to the uploader, matching the safer pattern already used on inkwell-images.
drop policy if exists "Anyone can delete place images" on storage.objects;
drop policy if exists "Anyone can update place images" on storage.objects;

create policy "Owners can update place images" on storage.objects for update
using (bucket_id = 'place-images' and owner = auth.uid());

create policy "Owners can delete place images" on storage.objects for delete
using (bucket_id = 'place-images' and owner = auth.uid());

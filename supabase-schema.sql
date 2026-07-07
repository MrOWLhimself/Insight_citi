-- Insight by CitiPlug
-- Run once in the Supabase SQL editor for project uysipsegizbixwgvwdzl.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  role text not null default 'contributor' check (role in ('contributor', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  cover_image_url text,
  template text not null default 'classic' check (template in ('classic', 'cover', 'split', 'analysis', 'essay', 'visual')),
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'rejected', 'archived')),
  featured boolean not null default false,
  premium boolean not null default false,
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

alter table public.articles
  add column if not exists template text not null default 'classic';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'articles_template_check'
  ) then
    alter table public.articles
      add constraint articles_template_check
      check (template in ('classic', 'cover', 'split', 'analysis', 'essay', 'visual'));
  end if;
end;
$$;

alter table public.ad_slots
  add column if not exists ad_mode text not null default 'manual';

alter table public.ad_slots
  add column if not exists network_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'ad_slots_ad_mode_check'
  ) then
    alter table public.ad_slots
      add constraint ad_slots_ad_mode_check
      check (ad_mode in ('manual', 'automatic'));
  end if;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists ad_slots_set_updated_at on public.ad_slots;
create trigger ad_slots_set_updated_at before update on public.ad_slots
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_insight_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('editor', 'admin')
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.articles enable row level security;
alter table public.ad_slots enable row level security;

drop policy if exists "profiles own read" on public.profiles;
create policy "profiles own read" on public.profiles for select
using (id = auth.uid() or public.is_insight_admin());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select using (true);

drop policy if exists "categories admin manage" on public.categories;
create policy "categories admin manage" on public.categories for all
using (public.is_insight_admin()) with check (public.is_insight_admin());

drop policy if exists "published articles public read" on public.articles;
create policy "published articles public read" on public.articles for select
using (status = 'published' or author_id = auth.uid() or public.is_insight_admin());

drop policy if exists "contributors create own articles" on public.articles;
create policy "contributors create own articles" on public.articles for insert
with check (author_id = auth.uid() and status in ('draft', 'review'));

drop policy if exists "contributors update own articles" on public.articles;
create policy "contributors update own articles" on public.articles for update
using (author_id = auth.uid() or public.is_insight_admin())
with check (
  public.is_insight_admin()
  or (author_id = auth.uid() and status in ('draft', 'review'))
);

drop policy if exists "contributors delete own drafts" on public.articles;
create policy "contributors delete own drafts" on public.articles for delete
using ((author_id = auth.uid() and status = 'draft') or public.is_insight_admin());

drop policy if exists "ads public read" on public.ad_slots;
create policy "ads public read" on public.ad_slots for select
using (
  active = true
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);

drop policy if exists "ads admin manage" on public.ad_slots;
create policy "ads admin manage" on public.ad_slots for all
using (public.is_insight_admin()) with check (public.is_insight_admin());

insert into public.categories (name, slug) values
  ('News', 'news'),
  ('Breaking', 'breaking'),
  ('Lifestyle', 'lifestyle'),
  ('Stories', 'stories'),
  ('Articles', 'articles'),
  ('Features', 'features'),
  ('Editorial', 'editorial'),
  ('Opinion', 'opinion'),
  ('Spotlight', 'spotlight'),
  ('Business', 'business'),
  ('Technology', 'technology'),
  ('AI', 'ai'),
  ('Education', 'education'),
  ('Health', 'health'),
  ('Entertainment', 'entertainment'),
  ('Sports', 'sports'),
  ('Travel', 'travel'),
  ('Culture', 'culture'),
  ('Politics', 'politics'),
  ('Environment', 'environment'),
  ('Fashion', 'fashion'),
  ('Food', 'food'),
  ('Music', 'music'),
  ('Videos', 'videos'),
  ('Campus', 'campus'),
  ('History', 'history'),
  ('Ijebu', 'ijebu'),
  ('Ogun State', 'ogun-state'),
  ('Nigeria', 'nigeria'),
  ('Africa', 'africa'),
  ('World', 'world'),
  ('Science', 'science'),
  ('Ideas', 'ideas'),
  ('Cities', 'cities')
on conflict (slug) do nothing;

insert into public.ad_slots (slot_key, label, headline, target_url, sponsor_name) values
  ('home_leaderboard_1', 'Homepage leaderboard', 'Reach readers who shape what happens next.', '#advertise', 'Insight Ads'),
  ('home_auto_top', 'Homepage automatic top', 'Programmatic-ready premium inventory.', '#advertise', 'Insight Ads'),
  ('home_top_right', 'Top stories rectangle', 'Your brand, in good company.', '#advertise', 'Insight Ads'),
  ('home_billboard_1', 'Homepage billboard', 'Ideas move people. Put your brand beside the right ones.', '#advertise', 'Insight Ads'),
  ('home_sidebar_1', 'Latest sidebar', 'Make an impression.', '#advertise', 'Insight Ads'),
  ('home_auto_mid', 'Homepage automatic mid', 'Auto-filled sponsor space for high-traffic sections.', '#advertise', 'Insight Ads'),
  ('home_infeed_1', 'Homepage in-feed', 'Tell a better brand story.', '#advertise', 'Insight Ads'),
  ('article_top', 'Article top banner', 'Intelligent brands meet intelligent readers.', '#advertise', 'Insight Ads'),
  ('article_sidebar', 'Article sidebar rectangle', 'Place your story here.', '#advertise', 'Insight Ads'),
  ('article_inline_1', 'Article inline after paragraph 4', 'Your campaign inside premium reading.', '#advertise', 'Insight Ads'),
  ('article_inline_2', 'Article inline after paragraph 8', 'Auto-filled story inventory.', '#advertise', 'Insight Ads'),
  ('category_top', 'Category top automatic', 'Category sponsorship inventory.', '#advertise', 'Insight Ads'),
  ('category_mid', 'Category mid manual', 'Own this category placement.', '#advertise', 'Insight Ads')
on conflict (slot_key) do nothing;

-- After your first account signs up, promote it manually:
-- update public.profiles set role = 'admin' where id = '<USER_UUID>';

-- ─── Storage: cover images and in-body rich-text images ─────────────────────
-- One public bucket. Files are readable by anyone (articles are public once
-- published), but only signed-in users can upload, and only into a folder
-- named after their own user id — so one contributor can't overwrite
-- another's files.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
using (bucket_id = 'media');

drop policy if exists "media authenticated upload" on storage.objects;
create policy "media authenticated upload" on storage.objects for insert
with check (
  bucket_id = 'media'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "media owner update" on storage.objects;
create policy "media owner update" on storage.objects for update
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects for delete
using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);


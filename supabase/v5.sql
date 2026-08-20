-- Historical — already folded into schema.sql. Kept for the record; a fresh
-- setup only needs to run schema.sql.
--
-- V5 migration. Run this whole file in Supabase > SQL Editor.
-- Adds: slug history for renamed collections, note authors, and note replies.

-- 1. every slug a collection has ever had, so old links keep working --------

create table if not exists album_slugs (
  slug text primary key,
  album_id uuid not null references albums(id) on delete cascade
);

alter table album_slugs enable row level security;

create policy "public read slug history"
  on album_slugs for select
  using (true);

create policy "owner write slug history"
  on album_slugs for all
  to authenticated
  using (true) with check (true);

-- remember every current slug as the starting history
insert into album_slugs (slug, album_id)
select slug, id from albums
on conflict (slug) do nothing;

-- 2. notes learn who wrote them --------------------------------------------

alter table site_notes
  add column if not exists author text;

-- 3. replies: at most two per note, enforced by the app ---------------------

create table if not exists note_replies (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references site_notes(id) on delete cascade,
  author text,
  status text,
  reply text not null,
  created_at timestamptz not null default now()
);

alter table note_replies enable row level security;

create policy "owner full access note replies"
  on note_replies for all
  to authenticated
  using (true) with check (true);

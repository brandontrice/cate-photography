-- Historical — already folded into schema.sql. Kept for the record; a fresh
-- setup only needs to run schema.sql.
--
-- V6 migration (Field Notes). Run whole file in Supabase > SQL Editor.

create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null default '',
  cover_photo_id uuid references photos(id) on delete set null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table posts enable row level security;

create policy "public read published posts"
  on posts for select
  using (published = true);

create policy "owner full access posts"
  on posts for all
  to authenticated
  using (true) with check (true);

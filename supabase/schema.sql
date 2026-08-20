-- Cate's photography site — run this whole file in Supabase > SQL Editor.
-- (Brandon's SQL style: lowercase keywords.)
--
-- This is the full, current schema: every table, column, and policy the app
-- uses today, in one file. It supersedes the old v2.sql...v8.sql migration
-- sequence (kept in this folder as historical record — see the note at the
-- top of each). Safe to run on a brand-new project, and safe to re-run on a
-- project that already has some or all of this: every statement below is
-- written to skip anything that already exists.

-- 1. tables ------------------------------------------------------------

create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  path_sm text not null,
  path_md text not null,
  path_lg text not null,
  width int not null,
  height int not null,
  caption text,
  place text,
  sort_order int not null default 0,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists photos_album_idx on photos(album_id, sort_order);

-- A collection's cover photo. Added after photos so the foreign key has
-- something to point at.
alter table albums
  add column if not exists cover_photo_id uuid references photos(id) on delete set null;

-- Every slug a collection has ever had, so old links keep working after a rename.
create table if not exists album_slugs (
  slug text primary key,
  album_id uuid not null references albums(id) on delete cascade
);

-- Small key/value store for site-wide choices (currently: the home page opening layout).
create table if not exists site_settings (
  key text primary key,
  value text not null
);

-- Cate's pinned feedback on the live site — the click-to-pin notes / tasks system.
create table if not exists site_notes (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  x_pct numeric not null,
  y_pct numeric not null,
  note text not null,
  author text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Replies on a note. At most two per note, enforced by the app, not the schema.
create table if not exists note_replies (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references site_notes(id) on delete cascade,
  author text,
  status text,
  reply text not null,
  created_at timestamptz not null default now()
);

-- Field Notes (the site's journal/blog).
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

-- A plain record of studio changes, for auditing and hand-reverting.
create table if not exists site_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text,
  action text not null,
  subject text,
  details text
);

-- Remember every current slug as the starting history (no-op on a fresh database).
insert into album_slugs (slug, album_id)
select slug, id from albums
on conflict (slug) do nothing;

-- 2. row level security ------------------------------------------------

alter table albums enable row level security;
alter table photos enable row level security;
alter table album_slugs enable row level security;
alter table site_settings enable row level security;
alter table site_notes enable row level security;
alter table note_replies enable row level security;
alter table posts enable row level security;
alter table site_log enable row level security;

-- anyone can read published albums
drop policy if exists "public read published albums" on albums;
create policy "public read published albums"
  on albums for select
  using (published = true);

-- visitors can never receive hidden photos, even in published collections
drop policy if exists "public read photos of published albums" on photos;
create policy "public read photos of published albums"
  on photos for select
  using (
    hidden = false
    and exists (
      select 1 from albums a
      where a.id = photos.album_id and a.published = true
    )
  );

drop policy if exists "public read slug history" on album_slugs;
create policy "public read slug history"
  on album_slugs for select
  using (true);

-- visitors need to read settings (the home page layout is one of them)
drop policy if exists "public read settings" on site_settings;
create policy "public read settings"
  on site_settings for select
  using (true);

drop policy if exists "public read published posts" on posts;
create policy "public read published posts"
  on posts for select
  using (published = true);

-- notes, replies, and the activity log are private to the two signed-in accounts

-- cate (any signed-in user — she and brandon are the only accounts) can do everything
drop policy if exists "owner full access albums" on albums;
create policy "owner full access albums"
  on albums for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner full access photos" on photos;
create policy "owner full access photos"
  on photos for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner write slug history" on album_slugs;
create policy "owner write slug history"
  on album_slugs for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner write settings" on site_settings;
create policy "owner write settings"
  on site_settings for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner full access site notes" on site_notes;
create policy "owner full access site notes"
  on site_notes for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner full access note replies" on note_replies;
create policy "owner full access note replies"
  on note_replies for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner full access posts" on posts;
create policy "owner full access posts"
  on posts for all
  to authenticated
  using (true) with check (true);

drop policy if exists "owner full access site log" on site_log;
create policy "owner full access site log"
  on site_log for all
  to authenticated
  using (true) with check (true);

-- 3. storage -----------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- The bucket is fully public at the file level: a hidden photo or a draft
-- collection's photos are only hidden from the listing APIs above, not from
-- someone who already has the direct storage URL. Paths are unguessable
-- (random uuids), so this is "unlisted," not truly private — an accepted
-- tradeoff for a two-person site, not an oversight.
drop policy if exists "public read photo files" on storage.objects;
create policy "public read photo files"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "owner write photo files" on storage.objects;
create policy "owner write photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "owner delete photo files" on storage.objects;
create policy "owner delete photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');

-- Cate's photography site — run this whole file in Supabase > SQL Editor.
-- (Brandon's SQL style: lowercase keywords.)

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
  created_at timestamptz not null default now()
);

create index if not exists photos_album_idx on photos(album_id, sort_order);

-- 2. row level security ------------------------------------------------

alter table albums enable row level security;
alter table photos enable row level security;

-- anyone can read published albums and their photos
create policy "public read published albums"
  on albums for select
  using (published = true);

create policy "public read photos of published albums"
  on photos for select
  using (exists (
    select 1 from albums a
    where a.id = photos.album_id and a.published = true
  ));

-- cate (any signed-in user — she is the only account) can do everything
create policy "owner full access albums"
  on albums for all
  to authenticated
  using (true) with check (true);

create policy "owner full access photos"
  on photos for all
  to authenticated
  using (true) with check (true);

-- 3. storage -----------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public read photo files"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "owner write photo files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos');

create policy "owner delete photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos');

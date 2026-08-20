-- Historical — already folded into schema.sql. Kept for the record; a fresh
-- setup only needs to run schema.sql.
--
-- V8 migration (per-photo visibility). Run whole file in Supabase > SQL Editor.

alter table photos
  add column if not exists hidden boolean not null default false;

-- Visitors can no longer receive hidden photos, even in published collections.
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

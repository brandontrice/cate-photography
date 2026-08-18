-- V2 migration — run this whole file in Supabase > SQL Editor.
-- Adds the cover photo choice to collections.

alter table albums
  add column if not exists cover_photo_id uuid references photos(id) on delete set null;

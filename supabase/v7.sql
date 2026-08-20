-- Historical — already folded into schema.sql. Kept for the record; a fresh
-- setup only needs to run schema.sql.
--
-- V7 migration (activity log). Run whole file in Supabase > SQL Editor.
-- A plain record of studio changes, for auditing and hand-reverting.

create table if not exists site_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  author text,
  action text not null,
  subject text,
  details text
);

alter table site_log enable row level security;

create policy "owner full access site log"
  on site_log for all
  to authenticated
  using (true) with check (true);

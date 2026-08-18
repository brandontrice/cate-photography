-- V4 migration — run this whole file in Supabase > SQL Editor.
-- Site settings: small key/value store for Cate's layout choices.

create table if not exists site_settings (
  key text primary key,
  value text not null
);

alter table site_settings enable row level security;

-- Visitors need to read settings (the home page layout is one of them);
-- only the signed-in accounts can change them.
create policy "public read settings"
  on site_settings for select
  using (true);

create policy "owner write settings"
  on site_settings for all
  to authenticated
  using (true) with check (true);

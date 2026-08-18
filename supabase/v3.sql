-- V3 migration — run this whole file in Supabase > SQL Editor.
-- Adds site notes: Cate's pinned feedback on the live site.

create table if not exists site_notes (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  x_pct numeric not null,
  y_pct numeric not null,
  note text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table site_notes enable row level security;

-- Notes are private to the signed-in account (Cate + Brandon's shared login).
-- Visitors can neither read nor write them.
create policy "owner full access site notes"
  on site_notes for all
  to authenticated
  using (true) with check (true);

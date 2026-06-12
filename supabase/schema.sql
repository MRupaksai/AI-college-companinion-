-- AI College Companion — Supabase schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard

create extension if not exists "uuid-ossp";

create table if not exists app_data (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table app_data enable row level security;

create policy "Allow public read write for demo"
  on app_data for all
  using (true)
  with check (true);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_data_updated on app_data;
create trigger app_data_updated
  before update on app_data
  for each row execute function update_updated_at();

create table if not exists syllabus_uploads (
  id uuid primary key default uuid_generate_v4(),
  file_name text,
  raw_text text not null,
  created_at timestamptz default now()
);

alter table syllabus_uploads enable row level security;

create policy "Allow public insert syllabus"
  on syllabus_uploads for insert
  with check (true);

create policy "Allow public read syllabus"
  on syllabus_uploads for select
  using (true);

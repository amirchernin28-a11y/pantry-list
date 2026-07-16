-- Pantry List schema for Supabase
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- Households (one per home)
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Home',
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

-- Categories (editable per household)
create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Items with target and current stock
create table items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  target_quantity int not null default 1 check (target_quantity >= 0),
  current_quantity int not null default 0 check (current_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_household_idx on categories(household_id);
create index items_household_idx on items(household_id);
create index items_category_idx on items(category_id);
create index households_invite_code_idx on households(invite_code);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger items_updated_at
  before update on items
  for each row execute function update_updated_at();

-- Row Level Security (open for anon — secured by unguessable household UUID + invite code)
alter table households enable row level security;
alter table categories enable row level security;
alter table items enable row level security;

create policy "households_select" on households for select using (true);
create policy "households_insert" on households for insert with check (true);
create policy "households_update" on households for update using (true);

create policy "categories_select" on categories for select using (true);
create policy "categories_insert" on categories for insert with check (true);
create policy "categories_update" on categories for update using (true);
create policy "categories_delete" on categories for delete using (true);

create policy "items_select" on items for select using (true);
create policy "items_insert" on items for insert with check (true);
create policy "items_update" on items for update using (true);
create policy "items_delete" on items for delete using (true);

-- Enable realtime for sync between phones
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table items;

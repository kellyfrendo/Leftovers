-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create table public.leftovers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  date_added date not null,
  description text not null,
  category text not null,
  container text not null,
  location text not null default '',
  eat_by date not null,
  created_at timestamptz not null default now()
);

create index leftovers_user_id_idx on public.leftovers (user_id);
create index leftovers_eat_by_idx on public.leftovers (eat_by);

alter table public.leftovers enable row level security;

create policy "Users can view own leftovers"
  on public.leftovers
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own leftovers"
  on public.leftovers
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own leftovers"
  on public.leftovers
  for delete
  using (auth.uid() = user_id);

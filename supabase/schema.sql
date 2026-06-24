-- Run this in the Supabase SQL editor for your project.

create table if not exists public.kitchen_sync (
  kitchen_key text primary key,
  device_id uuid,
  email text not null default '',
  notify_days_before integer not null default 3
    check (notify_days_before >= 0 and notify_days_before <= 30),
  notifications_enabled boolean not null default false,
  leftovers jsonb not null default '[]'::jsonb,
  shopping jsonb not null default '[]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  last_notified_date date
);

create index if not exists kitchen_sync_notifications_enabled_idx
  on public.kitchen_sync (notifications_enabled)
  where notifications_enabled = true;

-- If you already have kitchen_sync with device_id as the primary key, run this migration:
--
-- alter table public.kitchen_sync add column if not exists kitchen_key text;
-- update public.kitchen_sync set kitchen_key = device_id::text where kitchen_key is null;
-- alter table public.kitchen_sync drop constraint if exists kitchen_sync_pkey;
-- alter table public.kitchen_sync add primary key (kitchen_key);
-- alter table public.kitchen_sync add column if not exists shopping jsonb not null default '[]'::jsonb;
-- alter table public.kitchen_sync add column if not exists settings jsonb not null default '{}'::jsonb;
--
-- After migrating, open the app on one device, go to Settings → Shared kitchen,
-- copy the code, and enter it on your other devices.

-- The Netlify functions use the service role key (server-side only).
-- Do not put the service role key in the app.

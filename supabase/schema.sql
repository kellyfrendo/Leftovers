-- Run this in the Supabase SQL editor for your project.

create table if not exists public.kitchen_sync (
  device_id uuid primary key,
  email text not null default '',
  notify_days_before integer not null default 3
    check (notify_days_before >= 0 and notify_days_before <= 30),
  notifications_enabled boolean not null default false,
  leftovers jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  last_notified_date date
);

create index if not exists kitchen_sync_notifications_enabled_idx
  on public.kitchen_sync (notifications_enabled)
  where notifications_enabled = true;

-- The Netlify functions use the service role key (server-side only).
-- Do not put the service role key in the app.

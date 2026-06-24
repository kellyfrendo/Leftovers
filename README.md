# Leftovers — Fridge Tracker

Track what's in your fridge, when you put it in, and when it should be eaten by. **Kitchen Companion Version 2.0** stores everything in **Supabase** via Netlify — not in the browser.

## Use on iPad

The app must be opened in **Safari over HTTP** from your **Netlify URL** — not as a file from the Files app, and not from a local Mac server.

### Deploy to Netlify

1. Push this folder to [GitHub](https://github.com/kellyfrendo/Leftovers).
2. In [Netlify](https://app.netlify.com), **Add new site → Import from Git** → select the repo.
3. Complete the Supabase setup below and add Netlify environment variables.
4. On the iPad, open your Netlify URL in Safari → **Add to Home Screen**.

Each browser keeps a small anonymous **device ID** locally so the app knows which cloud kitchen to load. Your fridge items, shopping list, settings, and notification preferences all live in Supabase.

## Cloud storage setup (required)

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** (or **Table Editor**) and run the script in [`supabase/schema.sql`](supabase/schema.sql).
3. If you already created `kitchen_sync` for notifications only, also run the `ALTER TABLE` lines at the bottom of that file to add `settings` and `shopping` columns.
4. In **Project Settings → API**, copy:
   - **Project URL** (full URL, e.g. `https://YOUR-PROJECT.supabase.co`)
   - **service_role** key (keep this secret — server only)

### 2. Add Netlify environment variables

In your Netlify site → **Site configuration → Environment variables**, add:

| Variable | Value |
| -------- | ----- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

Redeploy the site after adding variables. The app loads your kitchen from the cloud on startup and saves changes automatically.

## Daily email notifications (optional)

You can get a **daily email** when fridge items are due soon or overdue. This also uses:

- **Resend** — delivers the email

### 1. Create a Resend account

1. Sign up at [resend.com](https://resend.com).
2. Create an API key.
3. Add and verify a **from** address (or use Resend’s test sender while trying it out).

### 2. Add more Netlify environment variables

| Variable | Value |
| -------- | ----- |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Leftovers <notifications@yourdomain.com>` |

Redeploy after adding them.

### 3. Turn on notifications in the app

1. Open the deployed Netlify site on your iPad.
2. Go to **Settings → Notifications**.
3. Enter your email, choose **Warn me (days before eat-by)** (default 3 days).
4. Turn on **Daily email** and tap **Save**.

Emails are sent **once per day at 8:00 UTC** when there are overdue items or items due within your chosen warning period. Change the schedule in [`netlify.toml`](netlify.toml) if you want a different time.

## Local development

The app requires Netlify Functions and Supabase, so `python3 -m http.server` alone is not enough for normal use. Deploy to Netlify (or use [Netlify CLI](https://docs.netlify.com/cli/get-started/) with `netlify dev`) to test cloud storage.

## Features

- Add leftovers with date, description, category, container, and location
- Automatic eat-by dates by category
- Fresh / use soon / overdue status
- Fridge overview by location with category filters
- Shopping list with export
- Settings for categories, containers, locations, and food shortcuts
- Inventory view and JSON backup import/export
- Cloud storage in Supabase (automatic save)
- Optional daily email notifications

## Category shelf life

Default eat-by periods are set per category in **Settings → Category** (e.g. fruit and vegetables 5 days, dairy 14 days, frozen items 90 days).

# Leftovers — Fridge Tracker

Track what's in your fridge, when you put it in, and when it should be eaten by. Data is saved on **each device** in the browser (no account needed).

## Use on iPad

The app must be opened in **Safari over HTTP** — not as a file from the Files app.

### Option A — Home Wi‑Fi (quick)

1. On your Mac, start a server:

```bash
cd /Users/KellyAnne/Leftovers
python3 -m http.server 8080
```

2. Find your Mac’s IP: **System Settings → Wi‑Fi → Details** (e.g. `192.168.1.123`).
3. On the iPad, open **Safari** and go to `http://YOUR-MAC-IP:8080`.
4. Tap **Share → Add to Home Screen** for an app icon on the iPad.

Data stays on that iPad. Your Mac and iPad each keep their own fridge list.

### Option B — Netlify (works anywhere)

1. Push this folder to [GitHub](https://github.com/kellyfrendo/Leftovers).
2. In [Netlify](https://app.netlify.com), **Add new site → Import from Git** → select the repo.
3. Deploy (no build command or env vars needed).
4. On the iPad, open your Netlify URL in Safari → **Add to Home Screen**.

Data stays on that iPad only.

## Daily email notifications (optional)

You can get a **daily email** when fridge items are due soon or overdue. This uses:

- **Supabase** — stores a copy of your fridge data in the cloud
- **Netlify Functions** — syncs from the app and sends a scheduled daily email
- **Resend** — delivers the email

The app still works offline on your iPad. Notifications only run after you deploy to Netlify and complete the setup below.

### 1. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the script in [`supabase/schema.sql`](supabase/schema.sql).
3. In **Project Settings → API**, copy:
   - **Project URL**
   - **service_role** key (keep this secret — server only)

### 2. Create a Resend account

1. Sign up at [resend.com](https://resend.com).
2. Create an API key.
3. Add and verify a **from** address (or use Resend’s test sender while trying it out).

### 3. Add Netlify environment variables

In your Netlify site → **Site configuration → Environment variables**, add:

| Variable | Value |
| -------- | ----- |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `Leftovers <notifications@yourdomain.com>` |

Redeploy the site after adding variables.

### 4. Turn on notifications in the app

1. Open the deployed Netlify site on your iPad.
2. Go to **Settings → Notifications**.
3. Enter your email, choose **Warn me (days before eat-by)** (default 3 days).
4. Turn on **Daily email** and tap **Save**.
5. Tap **Sync now** once to confirm it synced.

Emails are sent **once per day at 8:00 UTC** when there are overdue items or items due within your chosen warning period. Change the schedule in [`netlify.toml`](netlify.toml) if you want a different time.

## Run on your Mac

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Features

- Add leftovers with date, description, category, container, and location
- Automatic eat-by dates by category
- Fresh / use soon / overdue status
- Filter list and mark items as eaten
- Saves locally in the browser

## Category shelf life

| Category        | Days in fridge |
| --------------- | -------------- |
| Seafood         | 2              |
| Meat & poultry  | 3              |
| Cooked meal     | 4              |
| Soup & stew     | 4              |
| Other           | 4              |
| Vegetables      | 5              |
| Dairy           | 5              |

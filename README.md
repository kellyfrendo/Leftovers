# Leftovers — Fridge Tracker

Track what's in your fridge, when you put it in, and when it should be eaten by. Data is stored in **Supabase** so you can access it from any device after signing in.

## Features

- Add leftovers with date, description, category, container, and location
- Automatic eat-by dates based on food category
- Status badges: fresh, use soon, overdue
- Filter and mark items as eaten
- Sign in to sync across phone, tablet, and computer
- One-time import of old browser-only data on first sign-in

---

## 1. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com) and **New project**.
2. Open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it.
3. Go to **Authentication** → **Providers** → enable **Email** (enabled by default).
4. Go to **Project Settings** → **API** and copy:
   - **Project URL**
   - **anon public** key

### Auth URLs (after you deploy)

In **Authentication** → **URL Configuration**, set:

- **Site URL**: your Netlify URL (e.g. `https://your-app.netlify.app`)
- **Redirect URLs**: add the same URL

You can update these after the first deploy.

---

## 2. Run locally

```bash
cp config.example.js config.js
```

Edit `config.js` with your Supabase URL and anon key.

Serve the app (ES modules require a local server):

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

Or generate config from environment variables:

```bash
SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=eyJ... node scripts/generate-config.js
python3 -m http.server 8080
```

---

## 3. Deploy to Netlify

### Option A: GitHub + Netlify (recommended)

1. Push this folder to a GitHub repository.
2. In [Netlify](https://netlify.com), **Add new site** → **Import from Git**.
3. Select your repo. Netlify reads `netlify.toml` automatically:
   - **Build command**: `node scripts/generate-config.js`
   - **Publish directory**: `.` (root)
4. Under **Site settings** → **Environment variables**, add:

   | Key | Value |
   |-----|-------|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_ANON_KEY` | Your Supabase anon key |

5. Trigger a **Deploy**. Copy your site URL.
6. In Supabase **Authentication** → **URL Configuration**, set **Site URL** and **Redirect URLs** to your Netlify URL.

### Option B: Netlify CLI

```bash
npm run config   # with SUPABASE_URL and SUPABASE_ANON_KEY set
npx netlify deploy --prod
```

Set the same environment variables in the Netlify dashboard for future builds.

---

## Household sharing

Create one account and share the email/password with your household — everyone sees the same fridge when signed in.

---

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

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure and auth UI |
| `styles.css` | Styling |
| `app.js` | App logic and Supabase client |
| `config.js` | Supabase credentials (local, gitignored) |
| `config.example.js` | Template for local setup |
| `scripts/generate-config.js` | Writes `config.js` from env vars on deploy |
| `supabase/schema.sql` | Database table and security policies |
| `netlify.toml` | Netlify build settings |

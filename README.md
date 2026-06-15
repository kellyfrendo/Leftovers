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
